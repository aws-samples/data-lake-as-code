import * as cdk from "@aws-cdk/core";
import ec2 = require("@aws-cdk/aws-ec2");
import iam = require("@aws-cdk/aws-iam");
import rds = require("@aws-cdk/aws-rds");
import ssm = require("@aws-cdk/aws-ssm");
import lambda = require("@aws-cdk/aws-lambda");
import s3 = require("@aws-cdk/aws-s3");
import s3assets = require("@aws-cdk/aws-s3-assets");
import fs = require("fs");
import * as path from "path";
import { OpenTargetsBaseline } from "./baseline-stacks/baseline-opentargets";
import { ChemblBaseline } from "./baseline-stacks/baseline-chembl";
import { GTExBaseline } from "./baseline-stacks/baseline-gtex";
import { BindingDBBaseline } from "./baseline-stacks/baseline-bindingdb";
import { ClinvarVariantSummaryBaseline } from "./baseline-stacks/baseline-clinvarsummary";
import { DataLakeStack } from "../lib/stacks/datalake-stack";

interface coreDataLakeProps extends cdk.StackProps {
  coreDataLakeProps: DataLakeStack;
}

export class BaselineStack extends cdk.Stack {
  public readonly ChemblDb25: rds.DatabaseInstance;
  public readonly ChemblDb27: rds.DatabaseInstance;
  public readonly ChemblDb29: rds.DatabaseInstance;
  public readonly ChemblDBChemblDbAccessSg: ec2.SecurityGroup;
  public readonly ChemblDBSecret: rds.DatabaseSecret;
  public readonly OpenTargetsSourceBucket: s3.Bucket;
  public readonly Vpc: ec2.Vpc;
  public readonly Baseline_BindingDB: BindingDBBaseline; 
  // public readonly BindingDBSourceBucket: s3.Bucket;
  // public readonly BindingDb: rds.DatabaseInstance;
  // public readonly BindingDBAccessSg: ec2.SecurityGroup;
  // public readonly BindingDBSecret: rds.DatabaseSecret;
  public readonly GTExSourceBucket: s3.Bucket;
  public readonly ClinvarvariantSourceBucket: s3.Bucket;

  constructor(scope: cdk.Construct, id: string, props: coreDataLakeProps) {
    super(scope, id, props);

    const baselineVpc = new ec2.Vpc(this, "coreVpc", {
      cidr: "10.80.0.0/16",
      subnetConfiguration: [
        {
          cidrMask: 20,
          name: "dmz",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 20,
          name: "application",
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 20,
          name: "database",
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });

    this.Vpc = baselineVpc;

    /// Start ChEMBL

    const dmzSubnetSelection = { subnetType: ec2.SubnetType.PUBLIC };
    const appSubnetSelection = { subnetType: ec2.SubnetType.PRIVATE };
    const dbSubnetSelection = { subnetType: ec2.SubnetType.ISOLATED };

    baselineVpc.addS3Endpoint("s3Endpoint", [
      dmzSubnetSelection,
      appSubnetSelection,
      dbSubnetSelection,
    ]);

    const importInstanceRole = new iam.Role(this, "importInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    importInstanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );
    importInstanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
    );

    const importInstance = new ec2.Instance(this, "importInstance2", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.LARGE
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: baselineVpc,
      vpcSubnets: appSubnetSelection,
      instanceName: "ChemblDbImportInstance",
      role: importInstanceRole,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: ec2.BlockDeviceVolume.ebs(50),
        },
      ],
    });

    const importInstanceGtexBindingDb = new ec2.Instance(
      this,
      "importInstanceGtexBindingDb",
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.LARGE
        ),
        machineImage: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }),
        vpc: baselineVpc,
        vpcSubnets: appSubnetSelection,
        instanceName: "GTExImportInstance",
        role: importInstanceRole,
        blockDevices: [
          {
            deviceName: "/dev/xvda",
            volume: ec2.BlockDeviceVolume.ebs(200),
          },
        ],
      }
    );

    //// Start ChEMBL ////

    const chemblBaseline = new ChemblBaseline(this, "chemblBaseline", {
      TargetVPC: baselineVpc,
      ImportInstance: importInstance,
    });

    this.ChemblDb25 = chemblBaseline.Chembl25DatabaseInstance;
    this.ChemblDb27 = chemblBaseline.Chembl27DatabaseInstance;
    this.ChemblDb29 = chemblBaseline.Chembl29DatabaseInstance;
    this.ChemblDBSecret = chemblBaseline.DbSecret;
    this.ChemblDBChemblDbAccessSg = chemblBaseline.DbAccessSg;

    //// Start OpenTargets ////

    const openTargetsBaseline = new OpenTargetsBaseline(
      this,
      "openTargetsBaseline",
      {
        ImportInstance: importInstance,
      }
    );
    this.OpenTargetsSourceBucket = openTargetsBaseline.OpenTargetsSourceBucket;

    //// Start GTEx ////

    const gtexBaseline = new GTExBaseline(this, "gtexBaseline", {
      ImportInstance: importInstanceGtexBindingDb,
    });
    this.GTExSourceBucket = gtexBaseline.GTExSourceBucket;

    //// ClinVar Variant Summary ////
    const clinvarvariantBaseline = new ClinvarVariantSummaryBaseline(
      this,
      "clinVarVariantSummaryBaseline",
      {
        ImportInstance: importInstance
      }
    );
    this.ClinvarvariantSourceBucket =
      clinvarvariantBaseline.ClinvarVariantSummarySourceBucket;

    // Start Binding DB  ////
    //Comment since it launches OracleDB
    if (process.env.BINDINGDB !== "FALSE") {
      
      this.Baseline_BindingDB = new BindingDBBaseline(
        this,
        "bindingDbBaseline",
        {
          ImportInstance: importInstanceGtexBindingDb,
          TargetVPC: baselineVpc,
        }
      );
    }

    //// End Binding DB  ////
  }
}
