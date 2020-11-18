import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { RDSdataSetSetEnrollmentProps, RDSOracleDataSetEnrollment } from './constructs/rds-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';




export interface BindingDBEnrollmentProps extends DataSetStackProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
}

export class BindingDBStack extends DataSetStack{
	constructor(scope: cdk.Construct, id: string, props: BindingDBEnrollmentProps) {
		super(scope, id, props);
	
	
		const dataSetName = "binding_db";
		
		const clientOjdbcJar = new s3assets.Asset(this, `ojdbcClient`, {
			path: "baseline_binaries/ojdbc8.jar"
		});

		this.Enrollments.push(new RDSOracleDataSetEnrollment(this, 'binding-db-enrollment', {
	    	databaseSecret: props.databaseSecret,
	    	database: props.database,
	    	MaxDPUs: 5.0,
	    	AccessSubnet: props.database.vpc.privateSubnets[0] as ec2.Subnet,
	    	databaseSidOrServiceName: "orcl",
	    	accessSecurityGroup: props.accessSecurityGroup,
	    	dataLakeBucket: props.DataLake.DataLakeBucket,
	    	DataSetName: dataSetName,
	    	JdbcTargetIncludePaths: ["orcl/%"],
	    	GlueScriptPath: "scripts/glue.s3import.bindingdb.py",
			GlueScriptArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--extra-jars": clientOjdbcJar.s3ObjectUrl,
				"--user-jars-first": true,
				"--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
				"--DL_PREFIX": "/"+dataSetName+"/",
				"--DL_REGION": cdk.Stack.of(this).region,
				"--GLUE_SRC_DATABASE": "binding_db_src",
				"--SRC_SECRET_ARN": props.databaseSecret.secretArn,
				"--SRC_DB_HOSTNAME": props.database.dbInstanceEndpointAddress
			}	    	
		}));
		
		clientOjdbcJar.grantRead(this.Enrollments[0].DataEnrollment.DataSetGlueRole);
		props.databaseSecret.grantRead(this.Enrollments[0].DataEnrollment.DataSetGlueRole);
	}
}




