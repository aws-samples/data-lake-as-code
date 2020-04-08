import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import sagemaker = require('@aws-cdk/aws-sagemaker');

export interface AnalyticsStackProps extends cdk.StackProps{
    targetVpc: ec2.Vpc
}


export class AnalyticsStack extends cdk.Stack {
  
  constructor(scope: cdk.Construct, id: string, props: AnalyticsStackProps) {
    super(scope, id, props);
    
    
    const notebookSg = new ec2.SecurityGroup(this, 'notebookSg',{
       vpc: props.targetVpc
    });
    
    
    const lifecycleCode = [
            {"content": "echo hello" }
        ];
    const sageMakerIntanceLifecyclePolicy = new sagemaker.CfnNotebookInstanceLifecycleConfig(this, 'notebookLifecyclePolicy', {
        notebookInstanceLifecycleConfigName: "Boostrap-Chembl-OpenTargets-Demo-Notebook",
        onStart: lifecycleCode
        
    });
    
    const  sageMakerInstanceRole = new iam.Role(this, 'notebookInstanceRole', {
        roleName: "chemblOpenTargetsNotebookRole",
        assumedBy: new iam.ServicePrincipal('sagemaker')
    });
    
    
    new sagemaker.CfnNotebookInstance(this, 'analyticsNotebook', {
        instanceType : 'ml.t2.medium',
        volumeSizeInGb: 100,
        securityGroupIds: [notebookSg.securityGroupId],
        subnetId: props.targetVpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE}).subnetIds[0],
        notebookInstanceName: "Chembl-OpenTargets-Demo-Notebook",
        roleArn: sageMakerInstanceRole.roleArn,
        directInternetAccess: 'Disabled',
        lifecycleConfigName: sageMakerIntanceLifecyclePolicy.notebookInstanceLifecycleConfigName
    });
 
    
  }
}

