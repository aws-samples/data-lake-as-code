import * as cdk from "@aws-cdk/core";
import ec2 = require("@aws-cdk/aws-ec2");
import iam = require("@aws-cdk/aws-iam");
import glue = require("@aws-cdk/aws-glue");
import s3 = require("@aws-cdk/aws-s3");
import lakeformation = require("@aws-cdk/aws-lakeformation");
import s3assets = require("@aws-cdk/aws-s3-assets");
import {
  S3dataSetEnrollmentProps,
  S3dataSetEnrollment,
} from "./constructs/s3-data-set-enrollment";
import { DataSetStack, DataSetStackProps } from "./stacks/dataset-stack";

export interface ClinvarSummaryVariantSetProps extends DataSetStackProps {
  sourceBucket: s3.IBucket;
  sourceBucketDataPrefix: string;
}

export class ClinvarSummaryVariantStack extends DataSetStack {
  LakeFormationEnrollment: lakeformation.CfnResource;
  bucketRole: iam.Role;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: ClinvarSummaryVariantSetProps
  ) {
    super(scope, id, props);
    // Enroll private bucket into LakeFormation
    this.bucketRole = new iam.Role(this, "clinvarsummaryDatalakebucketRole", {
      assumedBy: new iam.ServicePrincipal("lakeformation.amazonaws.com"),
      description: "Role used by lakeformation to access resources.",
      roleName: "ClinVarLakeFormationServiceAccessRole",
    });

    props.sourceBucket.grantReadWrite(this.bucketRole);

    this.LakeFormationEnrollment = new lakeformation.CfnResource(
      this,
      "clinvarsummarydataLakeBucketLakeFormationResource",
      {
        resourceArn: props.sourceBucket.bucketArn,
        roleArn: this.bucketRole.roleArn,
        useServiceLinkedRole: true,
      }
    );
   
    // End Enroll private bucket into LakeFormation

    this.Enrollments.push(
      new S3dataSetEnrollment(this, "clinvar-summary-variants-enrollment", {
        DataSetName: "clinvar-summary-variants",
        MaxDPUs: 2.0,
        sourceBucket: props.sourceBucket,
        // sourceBucket: props.DataLake.DataLakeBucket,
        sourceBucketDataPrefixes: [`${props.sourceBucketDataPrefix}`],
        dataLakeBucket: props.DataLake.DataLakeBucket,
        GlueScriptPath: "scripts/glue.s3import.clinvar.variant.summary.py",
        GlueScriptArguments: {
          "--job-language": "python",
          "--job-bookmark-option": "job-bookmark-disable",
          "--enable-metrics": "",
          "--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName, // not used in script but picked up by CDK for Lake Formation Permissions
          "--SRC_BUCKET": props.sourceBucket.bucketName,
          "--SRC_PREFIX": props.sourceBucketDataPrefix,
          "--SRC_REGION": cdk.Stack.of(this).region,
          "--DL_PREFIX": props.sourceBucketDataPrefix,// not used in script but picked up by CDK for Lake Formation Permissions
          "--DEST_BUCKET": props.DataLake.DataLakeBucket.bucketName,
          "--timeStampPrefix": "2020/10/15", //Default get overwritten when lambda is invoked
          "--DEST_KEY": "variant_summary/transform/parquet/",
          "--info": "Triggered_directly_by_Lambda Function", // script doesn't use it just for IT info
        },
      })
    );

    // Ensure New Clinvar private bucket is enrolled in LakeFormation before applying LakeFormation Permissions
    const PrivateS3BucketPermissions = this.Enrollments[0].node.children.find(
      (c) => {
        var elm = c as cdk.CfnResource;
        //  console.log(elm.cfnResourceType)
        if (elm.cfnResourceType === "AWS::LakeFormation::Permissions") {
          elm.addDependsOn(this.LakeFormationEnrollment);
        }
      }
    );

    // Remove Glue Workflow not needed since Lambda will directly invoke Glue Job
    // const PrivateS3BucketPermissionsDepend = this.Enrollments[0].node.children.find(
    //   (c) => {
    //     var elm = c as cdk.CfnResource;
    //     if (elm.cfnResourceType === "AWS::Glue::Workflow") {
    //       elm.addDependsOn(this.LakeFormationEnrollment);
    //     }
    //   }
    // );
    // Add Custom Tag to ETL Glue Job so ClinVar Import Lambda Function will invoke this specificjob
    // Glue Tags only work onCreate not onUpdate
    const customGlueJobTagging = this.Enrollments[0].DataEnrollment.node.children.find(
      (c) => {
        var elm = c as cdk.CfnResource;
        if (elm.cfnResourceType === "AWS::Glue::Job") {
          cdk.Tags.of(elm).add("ClinvarVariantSummaryLambdaImport", "TRUE");
          var glueJob = elm as glue.CfnJob;
          // Version 2.0 for faster start-time, default = 1.0
          glueJob.glueVersion = "2.0";
        } else if (elm.cfnResourceType === "AWS::Glue::Crawler") {
          // Update src crawler to YEAR/MONTH/DAY Format manually
          if (elm.node.path.split("/").pop() == "clinvar-summary-variants-src-crawler") {
            var glueCrawlersrc = elm as glue.CfnCrawler;
            let targetSourcesrc = `s3://${props.DataLake.DataLakeBucket.bucketName}${props.sourceBucketDataPrefix}`.replace(
              "transform/parquet",
              "source"
            );
            
            // Overwrite dl crawler because default code doesnt pick up full path only last part of prefix
            glueCrawlersrc.targets = {
              s3Targets: [{ path: targetSourcesrc }],
            };
          } else if (elm.node.path.split("/").pop() == "clinvar-summary-variants-dl-crawler"){
            let glueCrawlerdl = elm as glue.CfnCrawler;
            let targetSourcedl = `s3://${props.DataLake.DataLakeBucket.bucketName}${props.sourceBucketDataPrefix}`
            glueCrawlerdl.targets = {
              s3Targets: [{ path: targetSourcedl }],
            };
          }
        }
      }
    );

    // Grant Glue Job Permissions to write to source S3 Bucket
    props.sourceBucket.grantReadWrite(
      this.Enrollments[0].DataEnrollment.DataSetGlueRole
    );

  }
}
