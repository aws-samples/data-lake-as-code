import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import ssm = require('@aws-cdk/aws-ssm');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import fs = require('fs');




export interface OpenTargetsBaselineProps extends cdk.StackProps {
  ImportInstance: ec2.Instance;
}


export class OpenTargetsBaseline extends cdk.Construct {

    public readonly OpenTargetsSourceBucket: s3.Bucket; 
    
    	
	constructor(scope: cdk.Construct, id: string, props: OpenTargetsBaselineProps) {
		super(scope, id);
    
        
        const openTargetsBucket = new s3.Bucket(this, 'openTargetsBucket');
        this.OpenTargetsSourceBucket = openTargetsBucket;
        
        this.OpenTargetsSourceBucket.grantReadWrite(props.ImportInstance.role);
        
        this.createAndApplyImportCommand("scripts/ssmdoc.import.opentargets.1911.json", props.ImportInstance, openTargetsBucket, "1911");
        this.createAndApplyImportCommand("scripts/ssmdoc.import.opentargets.20.06.json", props.ImportInstance, openTargetsBucket, "2006");
        this.createAndApplyImportCommand("scripts/ssmdoc.import.opentargets.latest.json", props.ImportInstance, openTargetsBucket, "latest", "cron(01 00 ? * SAT *)" );
        
        
    }
    
    createAndApplyImportCommand(commandDoc: string, instance: ec2.Instance, bucket: s3.Bucket, resourceSuffix: string, cronExpression?: string) {
        
        const loadOpenTargetsDoc = new ssm.CfnDocument(this, 'loadOpenTargetsDoc'+ resourceSuffix, {
            content: JSON.parse(fs.readFileSync(commandDoc, { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        const loadOpenTargetsAssociation = new ssm.CfnAssociation(this, 'loadOpenTargetsAssociation' + resourceSuffix,{
            name: loadOpenTargetsDoc.ref,
            targets: [
                { key: "InstanceIds", values: [instance.instanceId] }
            ],
            ...cronExpression && { scheduleExpression: cronExpression }
        });

        loadOpenTargetsAssociation.addPropertyOverride('Parameters',{
            openTargetsSourceFileTargetBucketLocation: [bucket.bucketName],
            executionTimeout: ['18000']
        });

        
    }
}