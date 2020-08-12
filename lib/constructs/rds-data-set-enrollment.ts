import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets')
import rds = require('@aws-cdk/aws-rds');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';
import { DataLakeEnrollment } from './data-lake-enrollment'


export interface RDSdataSetSetEnrollmentProps extends DataLakeEnrollment.DataLakeEnrollmentProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
	databaseSidOrServiceName: string;
	JdbcTargetIncludePaths: string[];
	MaxDPUs: number;
}




export class RDSDataSetEnrollment extends DataLakeEnrollment {
	
	jdbcConnStringPrefix: string; 
	jdbcConnStringPort: string;
	
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
			MaxDPUs: props.MaxDPUs,
			dataSetName: dataSetName,
			SourceConnectionInput: {
				connectionProperties: {
					USERNAME: props.databaseSecret.secretValueFromJson('username'),
					JDBC_ENFORCE_SSL: "false", 
					PASSWORD: props.databaseSecret.secretValueFromJson('password'),
					JDBC_CONNECTION_URL: `${this.jdbcConnStringPrefix}${props.database.dbInstanceEndpointAddress}:${this.jdbcConnStringPort}/${props.databaseSidOrServiceName}`			
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
			DataLakeTargets: {
			    s3Targets: [{ path: `s3://${props.dataLakeBucket.bucketName}/${dataSetName}/` }]
			},
			GlueScriptPath: props.GlueScriptPath,
			GlueScriptArguments: props.GlueScriptArguments
			
		});        
						

		this.createCoarseIamPolicy();
		this.grantGlueRoleLakeFormationPermissions(this.DataEnrollment.DataSetGlueRole, props.DataSetName); 

	}
}


export class RDSPostgresDataSetEnrollment extends RDSDataSetEnrollment{
	
    get jdbcConnStringPrefix(): string {
        return "jdbc:postgresql://";
    }
    get jdbcConnStringPort(): string {
        return "5432";
    }

	constructor(scope: cdk.Construct, id: string, props: RDSdataSetSetEnrollmentProps) {
		super(scope, id, props);
	}
}
export class RDSOracleDataSetEnrollment extends RDSDataSetEnrollment{

	get jdbcConnStringPrefix(): string {
        return "jdbc:oracle:thin://@";
    }
    get jdbcConnStringPort(): string {
        return "1521";
    }

	constructor(scope: cdk.Construct, id: string, props: RDSdataSetSetEnrollmentProps) {
		super(scope, id, props);
	}
}