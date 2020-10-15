import * as cdk from "@aws-cdk/core";
import ec2 = require("@aws-cdk/aws-ec2");
import iam = require("@aws-cdk/aws-iam");
import rds = require("@aws-cdk/aws-rds");
import glue = require("@aws-cdk/aws-glue");
import athena = require("@aws-cdk/aws-athena");
import cfn = require("@aws-cdk/aws-cloudformation");
import s3 = require("@aws-cdk/aws-s3");
import s3assets = require("@aws-cdk/aws-s3-assets");
import lakeformation = require("@aws-cdk/aws-lakeformation");
import { CustomResource } from "@aws-cdk/core";
import * as cr from "@aws-cdk/custom-resources";
import lambda = require("@aws-cdk/aws-lambda");
import fs = require("fs");

import {
  DataSetEnrollmentProps,
  DataSetEnrollment,
} from "../constructs/data-set-enrollment";

export interface DataLakeStackProps extends cdk.StackProps {
  starterLakeFormationAdminPrincipalArn: string;
}

export class DataLakeStack extends cdk.Stack {
  public readonly DataLakeBucket: s3.Bucket;
  public readonly AthenaResultsBucket: s3.Bucket;
  public readonly AthenaResultsBucketAccessPolicy: iam.ManagedPolicy;
  public readonly LakeFormationResource: lakeformation.CfnResource;
  public readonly PrimaryAthenaWorkgroup: athena.CfnWorkGroup;
  private readonly bucketRole: iam.Role;
  private readonly starterAdminArn: string;

  public grantAthenaResultsBucketPermission(principal: iam.IPrincipal) {
    if (principal instanceof iam.Role) {
      this.AthenaResultsBucketAccessPolicy.attachToRole(principal);
      return;
    }

    if (principal instanceof iam.User) {
      this.AthenaResultsBucketAccessPolicy.attachToUser(principal);
      return;
    }

    if (principal instanceof cdk.Resource) {
      try {
        const user = principal as iam.User;
        this.AthenaResultsBucketAccessPolicy.attachToUser(user);
        return;
      } catch (exception) {
        console.log(exception);
      }
      try {
        const role = principal as iam.Role;
        this.AthenaResultsBucketAccessPolicy.attachToRole(role);
        return;
      } catch (exception) {
        console.log(exception);
      }
    }
  }

  constructor(scope: cdk.Construct, id: string, props: DataLakeStackProps) {
    super(scope, id, props);

    // const dataLakeBucketProperties = {bucketName: "aws-ro"}

    this.DataLakeBucket = new s3.Bucket(this, "dataLakeBucket", {
      // bucketName: "aws-roda-hcls-datalake"
      bucketName:
        process.env.STACK_ENVIRONMENT === "DEV" ? "" : "aws-roda-hcls-datalake",
    });
    this.AthenaResultsBucket = new s3.Bucket(this, "athenaResultsBucket");

    new lakeformation.CfnDataLakeSettings(this, "starterAdminPermission", {
      admins: [
        {
          dataLakePrincipalIdentifier:
            props.starterLakeFormationAdminPrincipalArn,
        },
      ],
    });

    const coarseAthenaResultBucketAccess = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["s3:*"],
          Resource: [
            this.AthenaResultsBucket.bucketArn,
            this.AthenaResultsBucket.bucketArn + "/*",
          ],
        },
      ],
    };

    const coarseAthenaResultBucketAccessPolicyDoc = iam.PolicyDocument.fromJson(
      coarseAthenaResultBucketAccess
    );

    this.AthenaResultsBucketAccessPolicy = new iam.ManagedPolicy(
      this,
      `athenaResultBucketAccessPolicy`,
      {
        document: coarseAthenaResultBucketAccessPolicyDoc,
        description: `AthenaResultBucketAccessPolicy`,
      }
    );

    this.bucketRole = new iam.Role(this, "datalakebucketRole", {
      assumedBy: new iam.ServicePrincipal("lakeformation.amazonaws.com"),
      description: "Role used by lakeformation to access resources.",
      roleName: "LakeFormationServiceAccessRole",
    });

    this.DataLakeBucket.grantReadWrite(this.bucketRole);

    this.LakeFormationResource = new lakeformation.CfnResource(
      this,
      "dataLakeBucketLakeFormationResource",
      {
        resourceArn: this.DataLakeBucket.bucketArn,
        roleArn: this.bucketRole.roleArn,
        useServiceLinkedRole: true,
      }
    );

    const workGroupConfigCustResourceRole = new iam.Role(
      this,
      "workGroupConfigCustResourceRole",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      }
    );

    workGroupConfigCustResourceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    workGroupConfigCustResourceRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [
          this.formatArn({
            account: cdk.Stack.of(this).account,
            service: "athena",
            sep: "/",
            resource: "workgroup",
            resourceName: "primary",
          }),
        ],
        actions: ["athena:UpdateWorkGroup"],
        effect: iam.Effect.ALLOW,
      })
    );

    const workGroupConfigCustResource = new cfn.CustomResource(
      this,
      "workGroupConfigCustResource",
      {
        provider: cfn.CustomResourceProvider.lambda(
          new lambda.SingletonFunction(this, "Singleton", {
            role: workGroupConfigCustResourceRole,
            uuid: "f7d4f730-PPPP-11e8-9c2d-fa7ae01bbebc",
            code: new lambda.InlineCode(
              fs.readFileSync("scripts/lambda.updateprimaryworkgroup.py", {
                encoding: "utf-8",
              })
            ),
            handler: "index.main",
            timeout: cdk.Duration.seconds(60),
            runtime: lambda.Runtime.PYTHON_3_7,
          })
        ),
        properties: {
          WorkGroupName: "primary",
          TargetOutputLocationS3Url: `s3://${this.AthenaResultsBucket.bucketName}/`,
        },
      }
    );
  }
}
