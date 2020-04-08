import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './s3-data-set-enrollment';



export interface OpenTargetsEnrollmentProps extends cdk.StackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string;
	dataLakeBucket: s3.Bucket;
}


export class OpenTargetsStack extends cdk.Stack{
    
	constructor(scope: cdk.Construct, id: string, props: OpenTargetsEnrollmentProps) {
	    super(scope, id, props);
	    
	    
	    const openTargets1911 = new S3dataSetEnrollment(this, 'openTargets-1911-enrollment', {
	        DataSetName: "opentargets_1911",
	        sourceBucket: props.sourceBucket,
            sourceBucketDataPrefixes: [
                `${props.sourceBucketDataPrefix}19.11_association_data/` ,
                `${props.sourceBucketDataPrefix}19.11_disease_list/`,
                `${props.sourceBucketDataPrefix}19.11_evidence_data/`, 
                `${props.sourceBucketDataPrefix}19.11_target_list/`
            ],
	        dataLakeBucket: props.dataLakeBucket,
	        GlueScriptPath: "scripts/glue.s3import.opentargets.py",
	        GlueScriptArguments: {
                "--job-language": "python", 
                "--job-bookmark-option": "job-bookmark-disable",
                "--enable-metrics": "",
                "--DL_BUCKET": props.dataLakeBucket.bucketName,
                "--DL_PREFIX": "/opentargets_1911/",
                "--GLUE_SRC_DATABASE": "opentargets_1911_src"
            }
	    });
	    
	    
	    
	}
}

