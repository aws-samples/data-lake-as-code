import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './constructs/s3-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface OpenTargetsEnrollmentProps extends DataSetStackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string;
}


export class OpenTargetsStack extends DataSetStack{
    
	constructor(scope: cdk.Construct, id: string, props: OpenTargetsEnrollmentProps) {
	    super(scope, id, props);
	    
	    this.Enrollments.push(new S3dataSetEnrollment(this, 'openTargets-1911-enrollment', {
	        DataSetName: "opentargets_1911",
	        sourceBucket: props.sourceBucket,
	        MaxDPUs: 3.0,
            sourceBucketDataPrefixes: [
                `${props.sourceBucketDataPrefix}19.11/output/19.11_association_data/` ,
                `${props.sourceBucketDataPrefix}19.11/output/19.11_disease_list/`,
                `${props.sourceBucketDataPrefix}19.11/output/19.11_evidence_data/`, 
                `${props.sourceBucketDataPrefix}19.11/output/19.11_target_list/`
            ],
	        dataLakeBucket: props.DataLake.DataLakeBucket,
	        GlueScriptPath: "scripts/glue.s3import.opentargets.19.11.py",
	        GlueScriptArguments: {
                "--job-language": "python", 
                "--job-bookmark-option": "job-bookmark-disable",
                "--enable-metrics": "",
                "--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
                "--DL_REGION": cdk.Stack.of(this).region,
                "--DL_PREFIX": "/opentargets_1911/",
                "--GLUE_SRC_DATABASE": "opentargets_1911_src"
            }
	    }));



   	    this.Enrollments.push(new S3dataSetEnrollment(this, 'openTargets-20-06-enrollment', {
	        DataSetName: "opentargets_20_06",
	        sourceBucket: props.sourceBucket,
	        MaxDPUs: 5.0,
            sourceBucketDataPrefixes: [
                `${props.sourceBucketDataPrefix}20.06/output/20.06_association_data/` ,
                `${props.sourceBucketDataPrefix}20.06/output/20.06_disease_list/`,
                `${props.sourceBucketDataPrefix}20.06/output/20.06_evidence_data/`, 
                `${props.sourceBucketDataPrefix}20.06/output/20.06_target_list/`,
                `${props.sourceBucketDataPrefix}20.06/output/20.06_known_target_safety/` ,
                `${props.sourceBucketDataPrefix}20.06/output/20.06_experimental-toxicity/`,
                `${props.sourceBucketDataPrefix}20.06/output/20.06_tractability_buckets/`, 
                `${props.sourceBucketDataPrefix}20.06/output/20.06_baseline_expression_counts/`
            ],
	        dataLakeBucket: props.DataLake.DataLakeBucket,
	        GlueScriptPath: "scripts/glue.s3import.opentargets.20.06.py",
	        GlueScriptArguments: {
                "--job-language": "python", 
                "--job-bookmark-option": "job-bookmark-disable",
                "--enable-metrics": "",
                "--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
                "--DL_REGION": cdk.Stack.of(this).region,
                "--DL_PREFIX": "/opentargets_20_06/",
                "--GLUE_SRC_DATABASE": "opentargets_20_06_src"
            }
	    }));
	    
	    
	}
}

