import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import sagemaker = require('@aws-cdk/aws-sagemaker');
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';

export interface AnalyticsStackProps extends cdk.StackProps{
    targetVpc: ec2.Vpc
}


export class AnalyticsStack extends cdk.Stack {
  
  public readonly NotebookRole: iam.Role;
  
  constructor(scope: cdk.Construct, id: string, props: AnalyticsStackProps) {
    super(scope, id, props);
    
    
    const notebookSg = new ec2.SecurityGroup(this, 'notebookSg',{
       vpc: props.targetVpc
    });
    
    const athenaStagingDirectory = new s3.Bucket(this, 'athenaStagingDir', {});
    
    const lifecycleCode = [
            {"content": cdk.Fn.base64(`
            wget -O /home/ec2-user/SageMaker/opentargets.chembl.example.ipynb https://raw.githubusercontent.com/paulu-aws/chembl-opentargets-data-lake-example/master/scripts/sagemaker.opentargets.chembl.example.ipynb
            sudo chown ec2-user /home/ec2-user/SageMaker/opentargets.chembl.example.ipynb
            sed -i 's/XXXXAthenaStagingDirectoryXXXX/${athenaStagingDirectory.bucketName}/g' /home/ec2-user/SageMaker/opentargets.chembl.example.ipynb
            sed -i 's/XXXXAthenaRegionXXXX/${cdk.Stack.of(this).region}/g' /home/ec2-user/SageMaker/opentargets.chembl.example.ipynb
            `) }
        ];
    const sageMakerIntanceLifecyclePolicy = new sagemaker.CfnNotebookInstanceLifecycleConfig(this, 'notebookLifecyclePolicy', {
        notebookInstanceLifecycleConfigName: "Boostrap-Chembl-OpenTargets-Demo-Notebook",
        onStart: lifecycleCode
        
    });
    
    const notebookPolicy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:DescribeLogStreams",
                ],
                "Resource": "*"
            }
        ]
    };
    
    const notebookPolicyDoc = iam.PolicyDocument.fromJson(notebookPolicy);
    
    this.NotebookRole = new iam.Role(this, 'notebookInstanceRole', {
        roleName: "chemblOpenTargetsNotebookRole",
        assumedBy: new iam.ServicePrincipal('sagemaker'),
        inlinePolicies: {
            "notebookPermissions": notebookPolicyDoc
        }
    });
    
    athenaStagingDirectory.grantReadWrite(this.NotebookRole);
    

    
    new sagemaker.CfnNotebookInstance(this, 'analyticsNotebook', {
        instanceType : 'ml.t2.medium',
        volumeSizeInGb: 100,
        securityGroupIds: [notebookSg.securityGroupId],
        subnetId: props.targetVpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE}).subnetIds[0],
        notebookInstanceName: "Chembl-OpenTargets-Demo-Notebook",
        roleArn: this.NotebookRole.roleArn,
        directInternetAccess: 'Disabled',
        lifecycleConfigName: sageMakerIntanceLifecyclePolicy.notebookInstanceLifecycleConfigName
    });
 
    
  }
}

