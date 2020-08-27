import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './constructs/s3-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface ExampleS3DataSetProps extends DataSetStackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string;
}


export class ExampleS3DataSet extends DataSetStack{
    
	constructor(scope: cdk.Construct, id: string, props: ExampleS3DataSetProps) {
	    super(scope, id, props);
	    
        const dataSetName = "exampledataset_v1"

	    this.Enrollments.push(new S3dataSetEnrollment(this, `${dataSetName}Enrollment`, {
	        DataSetName: dataSetName,
	        sourceBucket: props.sourceBucket,
	        MaxDPUs: 3.0,
            sourceBucketDataPrefixes: [
                `${props.sourceBucketDataPrefix}table0/` ,
                `${props.sourceBucketDataPrefix}table1/`,
                `${props.sourceBucketDataPrefix}table2/`, 
                `${props.sourceBucketDataPrefix}tableX/`
            ],
	        dataLakeBucket: props.DataLake.DataLakeBucket,
	        GlueScriptPath: "scripts/glue.s3import.fullcopy.s3.py",
	        GlueScriptArguments: {
                "--job-language": "python", 
                "--job-bookmark-option": "job-bookmark-disable",
                "--enable-metrics": "",
                "--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
                "--DL_REGION": cdk.Stack.of(this).region,
                "--DL_PREFIX": `/${dataSetName}/`,
                "--GLUE_SRC_DATABASE": `${dataSetName}_src`
            }
	    }));



	    
	}
}
