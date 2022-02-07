import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { S3dataSetEnrollmentProps, S3dataSetEnrollment } from './constructs/s3-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface YT8MDataSetStackProps extends DataSetStackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string;
}


export class YT8MDataSetStack extends DataSetStack{
    
	constructor(scope: Construct, id: string, props: YT8MDataSetStackProps) {
	    super(scope, id, props);
	    
        const dataSetName = "yt8m_ods"; // NO CAPS!!!!


	    this.Enrollments.push(new S3dataSetEnrollment(this, `${dataSetName}Enrollment`, {
	        DataSetName: dataSetName,
	        sourceBucket: props.sourceBucket,
	        MaxDPUs: 10.0,
            sourceBucketDataPrefixes: [
                `${props.sourceBucketDataPrefix}2/video/` ,
                `${props.sourceBucketDataPrefix}2/frame/`,
                `${props.sourceBucketDataPrefix}3/segment/`,
                `${props.sourceBucketDataPrefix}vocabulary.csv`,
            ],
	        dataLakeBucket: props.DataLake.DataLakeBucket,
	        GlueScriptPath: "scripts/glue.s3import.yt8m.ods.py",
	        LocalJarsForGlueJob: ["scripts/extra-jars/spark-tensorflow-connector_2.11-1.15.jar"],
	        ExistingLakeFormationResource: this.DataLake.LakeFormationResource,
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
