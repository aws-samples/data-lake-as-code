import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './constructs/s3-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface GnomadStackProps extends DataSetStackProps {

}


export class GnomadStack extends DataSetStack{
    
	constructor(scope: cdk.Construct, id: string, props: GnomadStackProps) {
	    super(scope, id, props);
	    
        const dataSetName = "gnomad"; // NO CAPS!!!!
        //s3://aws-roda-hcls-datalake/thousandgenomes_dragen/.
        const sourceBucket = s3.Bucket.fromBucketName(this, "gnomadSourceBucket", "gnomad-sourcebucket");
        const sourceBucketDataPrefix = "/gnomad/";

	    this.Enrollments.push(new S3dataSetEnrollment(this, `${dataSetName}Enrollment`, {
	        DataSetName: dataSetName,
	        sourceBucket: sourceBucket,
	        MaxDPUs: 50.0,
            sourceBucketDataPrefixes: [
                `${sourceBucketDataPrefix}chrM/`,
                `${sourceBucketDataPrefix}sites/`
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
