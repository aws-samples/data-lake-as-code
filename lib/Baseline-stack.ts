import { Construct } from 'constructs';
import { App, Stack, StackProps } from 'aws-cdk-lib';


import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { SECFinancialsBaseline } from './baseline-stacks/SEC-financial-statements-baseline';


import fs = require("fs");
import * as path from "path";

import { DataLakeStack } from "../lib/stacks/datalake-stack";

interface coreDataLakeProps extends StackProps {
  coreDataLakeProps: DataLakeStack;
}

export class BaselineStack extends Stack {
  public readonly ChemblDb25: rds.DatabaseInstance;
  public readonly ChemblDb27: rds.DatabaseInstance;
  public readonly ChemblDBChemblDbAccessSg: ec2.SecurityGroup;
  public readonly ChemblDBSecret: rds.DatabaseSecret;
  public readonly Vpc: ec2.Vpc;

  public readonly SecFinancialStatementBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: coreDataLakeProps) {
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


    const importInstanceRole = new iam.Role(this, "importInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    importInstanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );
    importInstanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
    );

    const importInstance = new ec2.Instance(this, "importInstance", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.LARGE
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: baselineVpc,
      vpcSubnets: appSubnetSelection,
      instanceName: "ImportInstance",
      role: importInstanceRole,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: ec2.BlockDeviceVolume.ebs(200),
        },
      ],
    });

    //// Start SEC ////

    const secFinStatementBaseline = new SECFinancialsBaseline(this,"secFinaicalsBaseline",
      {
        ImportInstance: importInstance,
      }
    );
    this.SecFinancialStatementBucket = secFinStatementBaseline.SECSourceBucket;


  }
}