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

    const dataSetName = "clinvar_summary_variants"; // NO CAPS!!!!
    
    
    const lastestSummaryEnrollment = new S3dataSetEnrollment(this, "clinvar-summary-variants-enrollment", {
      DataSetName: dataSetName,
      MaxDPUs: 4.0,
      sourceBucket: props.sourceBucket,
      // sourceBucket: props.DataLake.DataLakeBucket,
      sourceBucketDataPrefixes: [
        `${props.sourceBucketDataPrefix}`
      ],
      dataLakeBucket: props.DataLake.DataLakeBucket,
      WorkflowCronScheduleExpression: "cron(16 01 ? * SUN *)",
      GlueScriptPath: "scripts/glue.s3import.clinvar.variant.summary.py",
      GlueScriptArguments: {
        "--job-language": "python",
        "--job-bookmark-option": "job-bookmark-disable",
        "--enable-metrics": "",
        "--GLUE_SRC_DATABASE": `${dataSetName}_src`,
        "--DL_REGION": cdk.Stack.of(this).region,
        "--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName, 
        "--DL_PREFIX": `/${dataSetName}/`
      },
    });
    
    
    this.Enrollments.push(lastestSummaryEnrollment);
    
    
    // Grant Glue Job Permissions to write to source S3 Bucket
    props.sourceBucket.grantReadWrite(
      this.Enrollments[0].DataEnrollment.DataSetGlueRole
    );

  }
}
