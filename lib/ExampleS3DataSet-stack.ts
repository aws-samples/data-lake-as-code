import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './constructs/s3-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface ExampleS3DataSetProps extends DataSetStackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string;
}


export class ExampleS3DataSet extends DataSetStack{
    
	constructor(scope: Construct, id: string, props: ExampleS3DataSetProps) {
	    super(scope, id, props);
	    
        const dataSetName = "exampledataset_v1"; // NO CAPS!!!!

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
                "--DL_REGION": Stack.of(this).region,
                "--DL_PREFIX": `/${dataSetName}/`,
                "--GLUE_SRC_DATABASE": `${dataSetName}_src`
            }
	    }));



	    
	}
}
