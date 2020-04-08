import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { RDSdataSetSetEnrollmentProps, RDSPostgresDataSetEnrollment } from './rds-data-set-enrollment';


export interface ChemblStackEnrollmentProps extends cdk.StackProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
	dataLakeBucket: s3.Bucket;
}

export class ChemblStack extends cdk.Stack{
	constructor(scope: cdk.Construct, id: string, props: ChemblStackEnrollmentProps) {
		super(scope, id, props);
	
	
		const dataSetName = "chembl_25";
		
	    const chembl25 = new RDSPostgresDataSetEnrollment(this, 'chembl-25-enrollment', {
	    	databaseSecret: props.databaseSecret,
	    	database: props.database,
	    	accessSecurityGroup: props.accessSecurityGroup,
	    	dataLakeBucket: props.dataLakeBucket,
	    	DataSetName: dataSetName,
	    	JdbcTargetIncludePaths: ["chembl_25/%"],
	    	GlueScriptPath: "scripts/glue.s3importchembl25.py",
			GlueScriptArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--DL_BUCKET": props.dataLakeBucket.bucketName,
				"--DL_PREFIX": "/"+dataSetName+"/",
				"--DL_REGION": cdk.Stack.of(this).region,
				"--GLUE_SRC_DATABASE": "chembl_25_src"
			}	    	
	    });
	}
}




