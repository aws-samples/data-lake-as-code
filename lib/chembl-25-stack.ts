import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataLakeEnrollmentWorkflow } from './data-set-enrollment';


export interface RDSdataSetSetEnrollmentProps extends DataSetEnrollmentProps {
	databaseSecret: rds.DatabaseSecret;
	database: rds.DatabaseInstance;
	accessSecurityGroup: ec2.SecurityGroup;
}

export class Chembl25Stack extends cdk.Stack {
	
	constructor(scope: cdk.Construct, id: string, props: RDSdataSetSetEnrollmentProps) {
		super(scope, id, props);
		
		
		const chembl_25_src = new glue.Database(this, 'chembl-25-src', {
			databaseName: 'chembl_25_src',
			locationUri: `s3://${props.dataLakeBucket.bucketName}/chembl/src/chembl25`
		});
		const chembl_25_dl = new glue.Database(this, 'chembl-25-dl', {
			databaseName: 'chembl_25_dl',
			locationUri: `s3://${props.dataLakeBucket.bucketName}/chembl/dl/chembl25`
		});
		
		var chemblConnectionInput = {
			connectionProperties: {
				USERNAME: props.databaseSecret.secretValueFromJson('username'),
				JDBC_ENFORCE_SSL: "false", 
				PASSWORD: props.databaseSecret.secretValueFromJson('password'),
				JDBC_CONNECTION_URL: `jdbc:postgresql://${props.database.dbInstanceEndpointAddress}:5432/chembl_25`			
			}
			,connectionType: "JDBC"
			,description: "chembl-25-src connection"
			,name: "chembl-25-src"
			,physicalConnectionRequirements: {
				availabilityZone: props.database.vpc.privateSubnets[0].availabilityZone,
				subnetId: props.database.vpc.privateSubnets[0].subnetId,
				securityGroupIdList: [props.accessSecurityGroup.securityGroupId],
				
			}
		};
		
		const chemblConnection = new glue.CfnConnection(this, 'chembl-25-src-connection', {
			catalogId: chembl_25_src.catalogId, 
			connectionInput: chemblConnectionInput
		});
		
		const chemblGlueRole = new iam.Role(this, 'chembleGlueROle', {
			assumedBy: new iam.ServicePrincipal('glue.amazonaws.com')
		});
		
		chemblGlueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
		chemblGlueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
		props.dataLakeBucket.grantReadWrite(chemblGlueRole);
		
		
		const chembl25Crawler = new glue.CfnCrawler(this, 'chembl25-crawler',{
			name: "chembl_25_src_crawler", 
			targets: {
				jdbcTargets: [
					{
						path: "chembl_25/%", 
						exclusions: [], 
						connectionName: chemblConnectionInput.name
					}
				], 
				catalogTargets: [], 
				s3Targets: [], 
			}, 
			role: chemblGlueRole.roleName,
			databaseName: chembl_25_src.databaseName, 
			schemaChangePolicy: {
				deleteBehavior: "DEPRECATE_IN_DATABASE", 
				updateBehavior: "UPDATE_IN_DATABASE",
			}, 
			tablePrefix: "", 
			classifiers: []
		});
		
		
		const chemblCopyTablesSparkScript = new s3assets.Asset(this, 'chemblCopyTablesSparkScript', {
			path: 'scripts/glue.s3importchembl25.py'
		});
		chemblCopyTablesSparkScript.grantRead(chemblGlueRole);
		
		
		const chembl_etl_job = new glue.CfnJob(this, 'chembl_etl_job', {
			executionProperty: {
				maxConcurrentRuns: 1
			}, 
			name: "chembl_src_to_dl_etl", 
			timeout: 2880, 
			glueVersion: "1.0", 
			maxCapacity: 11.0, 
			connections: {
				connections: [
					chemblConnectionInput.name
				]
			}, 
			command: {
				scriptLocation: `s3://${chemblCopyTablesSparkScript.s3BucketName}/${chemblCopyTablesSparkScript.s3ObjectKey}`, 
				name: "glueetl", 
				pythonVersion: "3"
			}, 
			role: chemblGlueRole.roleArn,
			maxRetries: 0, 
			defaultArguments: {
				"--job-language": "python", 
				"--job-bookmark-option": "job-bookmark-disable",
				"--enable-metrics": "",
				"--DL_BUCKET": props.dataLakeBucket.bucketName,
				"--DL_PREFIX": "/chembl/25/",
				"--DL_REGION": cdk.Stack.of(this).region,
				"--GLUE_SRC_DATABASE": chembl_25_src.databaseName
			}
		});
		
		const chembl_datalake_crawler = new glue.CfnCrawler(this, 'chembl_datalake_crawler',{
			name: "chembl_25_dl_crawler", 
			targets: {
				s3Targets: [
					{
						path: `s3://${props.dataLakeBucket.bucketName}/chembl/25/`
					}
				]
			},	
			role: chemblGlueRole.roleArn,
			databaseName: chembl_25_dl.databaseName,
			schemaChangePolicy: {
				deleteBehavior: "DEPRECATE_IN_DATABASE", 
				updateBehavior: "UPDATE_IN_DATABASE"
			}, 
			tablePrefix: ""
		});
		
		const datalakeEnrollmentWorkflow = new DataLakeEnrollmentWorkflow(this,'chemblDataLakeWorkflow',{
			workfowName: "chemblDataLakeEnrollmentWorkflow",
			srcCrawler: chembl25Crawler,
			etlJob: chembl_etl_job,
			datalakeCrawler: chembl_datalake_crawler
			
		})
	}
}