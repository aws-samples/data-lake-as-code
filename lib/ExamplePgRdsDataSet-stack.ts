import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import sm = require('@aws-cdk/aws-secretsmanager');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { RDSdataSetSetEnrollmentProps, RDSPostgresDataSetEnrollment } from './constructs/rds-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';




export interface ExamplePgRdsDataSetParams extends DataSetStackProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
	accessSubnetId: string;
}

export class ExamplePgRdsDataSet extends DataSetStack{
	constructor(scope: cdk.Construct, id: string, props: ExamplePgRdsDataSetParams) {
		super(scope, id, props);
	
	
		const dataSetName = "example_rds"; // NO CAPS!!!!
		
		this.Enrollments.push(new RDSPostgresDataSetEnrollment(this, `${dataSetName}-enrollment`, {
	    	databaseSecret: props.databaseSecret,
	    	database: props.database,
	    	databaseSidOrServiceName: "database_sid",
	    	JdbcTargetIncludePaths: ["database_name/%"],
	    	MaxDPUs: 5.0,
	    	accessSecurityGroup: props.accessSecurityGroup,
	    	AccessSubnet: ec2.Subnet.fromSubnetId(this, 'accessSubnet', props.accessSubnetId) as ec2.Subnet,
	    	dataLakeBucket: props.DataLake.DataLakeBucket,
	    	DataSetName: dataSetName,
	    	GlueScriptPath: "scripts/glue.s3import.fullcopy.rds.py",
			GlueScriptArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
				"--DL_PREFIX": "/"+dataSetName+"/",
				"--DL_REGION": cdk.Stack.of(this).region,
				"--GLUE_SRC_DATABASE": `${dataSetName}_src`
			}	    	
		}));
		
		
		
	}
}



