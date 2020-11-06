import * as cdk from "@aws-cdk/core";
import ec2 = require("@aws-cdk/aws-ec2");
import iam = require("@aws-cdk/aws-iam");
import rds = require("@aws-cdk/aws-rds");
import ssm = require("@aws-cdk/aws-ssm");
import s3 = require("@aws-cdk/aws-s3");
import lambda = require("@aws-cdk/aws-lambda");
import s3assets = require("@aws-cdk/aws-s3-assets");
import fs = require("fs");

export interface ClinvarVariantSummaryBaselineProps extends cdk.StackProps {
  coreDataLakeS3Bucket: s3.Bucket;
}

export class ClinvarVariantSummaryBaseline extends cdk.Construct {
  public readonly ClinvarVariantSummarySourceBucket: s3.Bucket;
  public readonly ClinvarVariantSummaryLambdaImport: lambda.Function;
  private readonly ClinvarVariantSummaryGZURL: string;
  private readonly ClinvarVarianySummaryGZURLMD5: string;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: ClinvarVariantSummaryBaselineProps
  ) {
    super(scope, id);

    this.ClinvarVariantSummaryGZURL =
      "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz";
    this.ClinvarVarianySummaryGZURLMD5 =
      "https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz.md5";

    this.ClinvarVariantSummarySourceBucket = new s3.Bucket(
      this,
      "ClinvarVariantSummaryBucket"
    );

    const lambdaRole = new iam.Role(this, "Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"), // required
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [
          this.ClinvarVariantSummarySourceBucket.bucketArn,
          this.ClinvarVariantSummarySourceBucket.arnForObjects("*"),
        ],
        actions: ["s3:GetObject", "s3:PutObject", "s3:CreateMultipartUpload"],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["glue:ListJobs", "glue:StartJobRun"],
      })
    );
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    this.ClinvarVariantSummaryLambdaImport = new lambda.Function(
      this,
      "importclinVariantSummaryLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_8,
        handler: "lambda-import-clinvarvariantsummary.handler",
        code: lambda.Code.fromAsset("scripts/", {
          exclude: ["**", "!lambda-import-clinvarvariantsummary.py"],
        }),
        role: lambdaRole,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(300),
        environment: {
          SRC_BUCKET: this.ClinvarVariantSummarySourceBucket.bucketName,
          DEST_BUCKET: props.coreDataLakeS3Bucket.bucketName,
          ImportGZ: this.ClinvarVariantSummaryGZURL,
          ImportGZMD5: this.ClinvarVarianySummaryGZURLMD5,
        },
      }
    );
  }
}
