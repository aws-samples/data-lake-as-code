import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import ssm = require('@aws-cdk/aws-ssm');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import fs = require('fs');




export interface GTExBaselineProps extends cdk.StackProps {
  ImportInstance: ec2.Instance;
}


export class GTExBaseline extends cdk.Construct {

    public readonly GTExSourceBucket: s3.Bucket; 
    
    	
	constructor(scope: cdk.Construct, id: string, props: GTExBaselineProps) {
		super(scope, id);
    
        
        this.GTExSourceBucket = new s3.Bucket(this, 'GTExBucket');
        
        this.GTExSourceBucket.grantReadWrite(props.ImportInstance.role);
        
        this.createAndApplyImportCommand("scripts/ssmdoc.import.gtex.8.json", props.ImportInstance, this.GTExSourceBucket, "v8");
        
        
    }
    
    createAndApplyImportCommand(commandDoc: string, instance: ec2.Instance, bucket: s3.Bucket, resourceSuffix: string) {
        
        const loadDataDoc = new ssm.CfnDocument(this, 'loadGTExDoc'+ resourceSuffix, {
            content: JSON.parse(fs.readFileSync(commandDoc, { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        const loadDataAssociation = new ssm.CfnAssociation(this, 'loadGTExAssociation' + resourceSuffix,{
            name: loadDataDoc.ref,
            targets: [
                { key: "InstanceIds", values: [instance.instanceId] }
            ]
        });

        loadDataAssociation.addPropertyOverride('Parameters',{
            SourceFileTargetBucketLocation: [bucket.bucketName]
        });

        
    }
}