import { Construct } from 'constructs';
import { App, Stack, Resource, StackProps, CustomResource,  Duration, DefaultStackSynthesizer, Fn } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as lakeformation from 'aws-cdk-lib/aws-lakeformation';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';

import * as fs from "fs";

import {
  DataSetEnrollmentProps,
  DataSetEnrollment,
} from "../constructs/data-set-enrollment";

export interface DataLakeStackProps extends StackProps {

}

export class DataLakeStack extends Stack {
  public readonly DataLakeBucket: s3.Bucket;
  public readonly AthenaResultsBucket: s3.Bucket;
  public readonly AthenaResultsBucketAccessPolicy: iam.ManagedPolicy;
  public readonly LakeFormationResource: lakeformation.CfnResource;
  public readonly PrimaryAthenaWorkgroup: athena.CfnWorkGroup;
  private readonly bucketRole: iam.Role;

  public grantAthenaResultsBucketPermission(principal: iam.IPrincipal) {
    
    if (principal instanceof iam.Role) {
      this.AthenaResultsBucketAccessPolicy.attachToRole(principal);
      return;
    }

    if (principal instanceof iam.User) {
      this.AthenaResultsBucketAccessPolicy.attachToUser(principal);
      return;
    }

    if (principal instanceof iam.ArnPrincipal) {
      
      if(principal.arn.includes(":role/")){
        this.AthenaResultsBucketAccessPolicy.attachToRole(iam.Role.fromRoleArn(this,'importedRole',principal.arn));
      }

      if(principal.arn.includes(":user/")){
        this.AthenaResultsBucketAccessPolicy.attachToUser(iam.User.fromUserArn(this,'importedUser',principal.arn));
      }
      
  
    }
  }

  constructor(scope: Construct, id: string, props: DataLakeStackProps) {
    super(scope, id, props);


    this.DataLakeBucket = new s3.Bucket(this, 'dataLakeBucket',{
      bucketName: 'aws-roda-fintech-datalake'
    });
    this.AthenaResultsBucket = new s3.Bucket(this, "athenaResultsBucket");


    new lakeformation.CfnDataLakeSettings(this, "cdkCfnExecRoleAdminPermission", {
      admins: [
        {
          dataLakePrincipalIdentifier: Fn.sub((this.synthesizer as DefaultStackSynthesizer).cloudFormationExecutionRoleArn)
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

    this.AthenaResultsBucketAccessPolicy = new iam.ManagedPolicy(this, `athenaResultBucketAccessPolicy`,
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

    this.LakeFormationResource = new lakeformation.CfnResource(this,"dataLakeBucketLakeFormationResource",
      {
        resourceArn: this.DataLakeBucket.bucketArn,
        roleArn: this.bucketRole.roleArn,
        useServiceLinkedRole: true,
      }
    );

    const workGroupConfigCustResourceRole = new iam.Role(this,"workGroupConfigCustResourceRole",
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
            account: Stack.of(this).account,
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
     
     
    const updatePrimaryWorkgroup = new lambda.SingletonFunction(this, "Singleton", {
        role: workGroupConfigCustResourceRole,
        uuid: "f7d4f730-PPPP-11e8-9c2d-fa7ae01bbebc",
        code: new lambda.InlineCode(
          fs.readFileSync("scripts/lambda.updateprimaryworkgroup.py", {
            encoding: "utf-8",
          })
        ),
        handler: "index.main",
        timeout: Duration.seconds(60),
        runtime: lambda.Runtime.PYTHON_3_7,
    });

    const primaryWorkingGroupProvider = new cr.Provider(this, 'workgroupEnableProvider', {
      onEventHandler: updatePrimaryWorkgroup,
    });
    
    const workGroupConfigCustResource = new CustomResource(this, 'WorkgroupEnabledPromise', { 
        serviceToken: primaryWorkingGroupProvider.serviceToken, 
        properties: {
          WorkGroupName: "primary",
          TargetOutputLocationS3Url: `s3://${this.AthenaResultsBucket.bucketName}/`,
        }
    });
    
    
  }
}

