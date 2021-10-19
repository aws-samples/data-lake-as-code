import { Construct } from 'constructs';
import { App, Stack, StackProps } from 'aws-cdk-lib';


import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import fs = require('fs');

export interface SECFinancialsBaselineProps extends StackProps {
  ImportInstance: ec2.Instance;
}


export class SECFinancialsBaseline extends Construct {

    public readonly SECSourceBucket: s3.Bucket; 
    
    	
	constructor(scope: Construct, id: string, props: SECFinancialsBaselineProps) {
		super(scope, id);
    
        
        const secDataBucket = new s3.Bucket(this, 'secDataBucket');
        this.SECSourceBucket = secDataBucket;
        
        this.SECSourceBucket.grantReadWrite(props.ImportInstance.role);
        
        this.createAndApplyImportCommand("scripts/ssmdoc.import.sec.financialstatements.json", props.ImportInstance, this.SECSourceBucket, "");
        
        
    }
    
    createAndApplyImportCommand(commandDoc: string, instance: ec2.Instance, bucket: s3.Bucket, resourceSuffix: string) {
        
        const loadSecDataDoc = new ssm.CfnDocument(this, 'loadSecDataDoc'+ resourceSuffix, {
            content: JSON.parse(fs.readFileSync(commandDoc, { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        const loadSecDataAssociation = new ssm.CfnAssociation(this, 'loadSecDataAssociation' + resourceSuffix,{
            name: loadSecDataDoc.ref,
            scheduleExpression: "cron(01 00 ? * SUN *)",
            targets: [
                { key: "InstanceIds", values: [instance.instanceId] }
            ]
        });

        loadSecDataAssociation.addPropertyOverride('Parameters',{
            SourceFileTargetBucketLocation: [bucket.bucketName]
        });

        
    }
}