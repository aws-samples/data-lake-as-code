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
  ImportInstance: ec2.Instance;
}

export class ClinvarVariantSummaryBaseline extends cdk.Construct {
  public readonly ClinvarVariantSummarySourceBucket: s3.Bucket;


  constructor(
    scope: cdk.Construct,
    id: string,
    props: ClinvarVariantSummaryBaselineProps
  ) {
    super(scope, id);

    
        
        const clinvarSourceBucket = new s3.Bucket(this, 'clinvarBucket');
        this.ClinvarVariantSummarySourceBucket = clinvarSourceBucket;
        
        this.ClinvarVariantSummarySourceBucket.grantReadWrite(props.ImportInstance.role);
        
        this.createAndApplyImportCommand("scripts/ssmdoc.import.clinvar.latest.json", props.ImportInstance, clinvarSourceBucket, "");
        
        
    }
    
    createAndApplyImportCommand(commandDoc: string, instance: ec2.Instance, bucket: s3.Bucket, resourceSuffix: string) {
        
        const loadOpenTargetsDoc = new ssm.CfnDocument(this, 'loadOpenTargetsDoc'+ resourceSuffix, {
            content: JSON.parse(fs.readFileSync(commandDoc, { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        const loadOpenTargetsAssociation = new ssm.CfnAssociation(this, 'loadOpenTargetsAssociation' + resourceSuffix,{
            name: loadOpenTargetsDoc.ref,
            scheduleExpression: "cron(01 00 ? * SUN *)",
            targets: [
                { key: "InstanceIds", values: [instance.instanceId] }
            ]
        });

        loadOpenTargetsAssociation.addPropertyOverride('Parameters',{
            openTargetsSourceFileTargetBucketLocation: [bucket.bucketName]
        });

        
    }
    
}
