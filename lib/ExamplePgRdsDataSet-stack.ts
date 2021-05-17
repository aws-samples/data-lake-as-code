import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';

import { RDSdataSetSetEnrollmentProps, RDSPostgresDataSetEnrollment } from './constructs/rds-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';


export interface ExamplePgRdsDataSetParams extends DataSetStackProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
	accessSubnet: ec2.Subnet;
}

export class ExamplePgRdsDataSet extends DataSetStack{
	constructor(scope: Construct, id: string, props: ExamplePgRdsDataSetParams) {
		super(scope, id, props);
	
	
		const dataSetName = "example_rds"; // NO CAPS!!!!
		
		this.Enrollments.push(new RDSPostgresDataSetEnrollment(this, `${dataSetName}-enrollment`, {
	    	databaseSecret: props.databaseSecret,
	    	database: props.database,
	    	databaseSidOrServiceName: "database_sid",
	    	JdbcTargetIncludePaths: ["database_name/%"],
	    	MaxDPUs: 5.0,
	    	accessSecurityGroup: props.accessSecurityGroup,
	    	AccessSubnet: props.accessSubnet,
	    	dataLakeBucket: props.DataLake.DataLakeBucket,
	    	DataSetName: dataSetName,
	    	GlueScriptPath: "scripts/glue.s3import.fullcopy.rds.py",
			GlueScriptArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
				"--DL_PREFIX": "/"+dataSetName+"/",
				"--DL_REGION": Stack.of(this).region,
				"--GLUE_SRC_DATABASE": `${dataSetName}_src`
			}	    	
		}));
		
		
		
	}
}



