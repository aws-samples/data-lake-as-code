import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets')
import rds = require('@aws-cdk/aws-rds');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';
import { DataLakeEnrollment, DataLakeEnrollmentProps } from './datalake-stack'


export interface RDSdataSetSetEnrollmentProps extends DataLakeEnrollmentProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
	JdbcTargetIncludePaths: string[];
}


export class RDSPostgresDataSetEnrollment extends DataLakeEnrollment {
	constructor(scope: cdk.Construct, id: string, props: RDSdataSetSetEnrollmentProps) {
		super(scope, id, props);
	
		const dataSetName = props.DataSetName;
        const dataSetSourceConnectionName = `${dataSetName}-src`
        
        let includeTargets = new Array<glue.CfnCrawler.JdbcTargetProperty>();
        
        for(let includePath of props.JdbcTargetIncludePaths ){
		    includeTargets.push({
				path: includePath, 
				exclusions: [], 
				connectionName: dataSetSourceConnectionName
			});
            
        }
        
        this.DataEnrollment = new DataSetEnrollment(this, 'rdsDatasetEnrollment', {
			dataLakeBucket: props.dataLakeBucket,
			dataSetName: dataSetName,
			SourceConnectionInput: {
				connectionProperties: {
					USERNAME: props.databaseSecret.secretValueFromJson('username'),
					JDBC_ENFORCE_SSL: "false", 
					PASSWORD: props.databaseSecret.secretValueFromJson('password'),
					JDBC_CONNECTION_URL: `jdbc:postgresql://${props.database.dbInstanceEndpointAddress}:5432/chembl_25`			
				}
				,connectionType: "JDBC"
				,description: `${dataSetName} connection`
				,name: dataSetSourceConnectionName
				,physicalConnectionRequirements: {
					availabilityZone: props.database.vpc.privateSubnets[0].availabilityZone,
					subnetId: props.database.vpc.privateSubnets[0].subnetId,
					securityGroupIdList: [props.accessSecurityGroup.securityGroupId],
				}
			},
			SourceTargets: {
				jdbcTargets: includeTargets
			},
			GlueScriptPath: props.GlueScriptPath,
			GlueScriptArguments: props.GlueScriptArguments
			
		});        
        
	
	}
}