import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { RDSdataSetSetEnrollmentProps, RDSPostgresDataSetEnrollment } from './constructs/rds-data-set-enrollment';
import { DataSetStack, DataSetStackProps} from './stacks/dataset-stack';




export interface ChemblStackEnrollmentProps extends DataSetStackProps {
	databaseSecret: rds.DatabaseSecret;
	ChemblDb25: rds.DatabaseInstance;
	ChemblDb27: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
}

export class ChemblStack extends DataSetStack{
	constructor(scope: cdk.Construct, id: string, props: ChemblStackEnrollmentProps) {
		super(scope, id, props);
	
	
		const dataSetNameChembl25 = "chembl_25";
		
		
		this.Enrollments.push(new RDSPostgresDataSetEnrollment(this, 'chembl-25-enrollment', {
	    	databaseSecret: props.databaseSecret,
	    	database: props.ChemblDb25,
	    	databaseSidOrServiceName: "chembl_25",
	    	MaxDPUs: 5.0,
	    	accessSecurityGroup: props.accessSecurityGroup,
	    	dataLakeBucket: props.DataLake.DataLakeBucket,
	    	DataSetName: dataSetNameChembl25,
	    	JdbcTargetIncludePaths: ["chembl_25/%"],
	    	GlueScriptPath: "scripts/glue.s3importchembl25.py",
			GlueScriptArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
				"--DL_PREFIX": "/"+dataSetNameChembl25+"/",
				"--DL_REGION": cdk.Stack.of(this).region,
				"--GLUE_SRC_DATABASE": "chembl_25_src"
			}	    	
		}));
		
		const dataSetNameChembl27 = "chembl_27";
		
		this.Enrollments.push(new RDSPostgresDataSetEnrollment(this, 'chembl-27-enrollment', {
	    	databaseSecret: props.databaseSecret,
	    	database: props.ChemblDb27,
	    	MaxDPUs: 5.0,
	    	databaseSidOrServiceName: "chembl_27",
	    	accessSecurityGroup: props.accessSecurityGroup,
	    	dataLakeBucket: props.DataLake.DataLakeBucket,
	    	DataSetName: dataSetNameChembl27,
	    	JdbcTargetIncludePaths: ["chembl_27/%"],
	    	GlueScriptPath: "scripts/glue.s3importchembl25.py",
			GlueScriptArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--DL_BUCKET": props.DataLake.DataLakeBucket.bucketName,
				"--DL_PREFIX": "/"+dataSetNameChembl27+"/",
				"--DL_REGION": cdk.Stack.of(this).region,
				"--GLUE_SRC_DATABASE": "chembl_27_src"
			}	    	
		}));
		
	}
}




