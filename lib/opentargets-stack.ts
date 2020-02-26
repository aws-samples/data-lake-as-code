import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataLakeEnrollmentWorkflow } from './data-set-enrollment';


export interface S3dataSetEnrollmentProps extends DataSetEnrollmentProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefix: string
}

export class OpenTargetsStack extends cdk.Stack {
    
  constructor(scope: cdk.Construct, id: string, props: S3dataSetEnrollmentProps) {
        super(scope, id, props);
        
        const open_targets_1911_src = new glue.Database(this, 'open-targets-1911-src', {
            databaseName: 'open-targets-1911-src',
            locationUri: `s3://${props.sourceBucket.bucketName}/${props.sourceBucketDataPrefix}`
        });
        
        const open_targets_1911_dl = new glue.Database(this, 'open-targets-1911-dl', {
            databaseName: 'open-targets-1911-dl',
            locationUri: `s3://${props.dataLakeBucket.bucketName}/opentargets/dl/19_11`
        });
        
        const openTargetsGlueRole = new iam.Role(this, 'openTargetsGlueRole', {
          assumedBy: new iam.ServicePrincipal('glue.amazonaws.com')
        });
        
        openTargetsGlueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'));
        openTargetsGlueRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
        props.dataLakeBucket.grantReadWrite(openTargetsGlueRole);
        props.sourceBucket.grantReadWrite(openTargetsGlueRole);
        
        
        const openTargets_src_crawler = new glue.CfnCrawler(this, 'openTargets_src_crawler',{
            name: "opentargets_19_11_src_crawler", 
            targets: {
                s3Targets: [
                    {
                        path: `s3://${props.sourceBucket.bucketName}${props.sourceBucketDataPrefix}19.11_association_data/` 
                    },  
                    {
                        path: `s3://${props.sourceBucket.bucketName}${props.sourceBucketDataPrefix}19.11_disease_list/`
                    }, 
                    {
                        path: `s3://${props.sourceBucket.bucketName}${props.sourceBucketDataPrefix}19.11_evidence_data/` 
                    }, 
                    {
                        path: `s3://${props.sourceBucket.bucketName}${props.sourceBucketDataPrefix}19.11_target_list/`
                    }
                ], 
            }, 
            role: openTargetsGlueRole.roleArn,
            databaseName: open_targets_1911_src.databaseName, 
            schemaChangePolicy: {
                deleteBehavior: "DEPRECATE_IN_DATABASE", 
                updateBehavior: "UPDATE_IN_DATABASE"
            }, 
            tablePrefix: ""
        });
    
    
        const openTargetsCopyTablesScript = new s3assets.Asset(this, 'opentargetsCopyTables', {
            path: 'scripts/glue.s3import.opentargets.py'
        });
        openTargetsCopyTablesScript.grantRead(openTargetsGlueRole);
    
        const openTargets_etl_job = new glue.CfnJob(this, 'opentargets_etl_job', {
            executionProperty: {
                maxConcurrentRuns: 1
            }, 
            name: "opentargets_src_to_dl_etl", 
            timeout: 2880, 
            glueVersion: "1.0", 
            maxCapacity: 10, 
            command: {
                scriptLocation: `s3://${openTargetsCopyTablesScript.s3BucketName}/${openTargetsCopyTablesScript.s3ObjectKey}`, 
                name: "glueetl", 
                pythonVersion: "3"
            }, 
            role: openTargetsGlueRole.roleArn, 
            maxRetries: 0,
            defaultArguments: {
                "--job-language": "python", 
                "--job-bookmark-option": "job-bookmark-disable",
                "--enable-metrics": "",
                "--DL_BUCKET": props.dataLakeBucket.bucketName,
                "--DL_PREFIX": "/opentargets/19_11/",
                "--GLUE_SRC_DATABASE": open_targets_1911_src.databaseName
            }
        });
        

        const openTargets_datalake_crawler = new glue.CfnCrawler(this, 'openTargets_datalake_crawler',{
            name: "opentargets_19_11_dl_crawler", 
            targets: {
                s3Targets: [
                    {
                        path: `s3://${props.dataLakeBucket.bucketName}/opentargets/19_11/association_data/` 
                    },  
                    {
                        path: `s3://${props.dataLakeBucket.bucketName}/opentargets/19_11/disease_list/`
                    }, 
                    {
                        path: `s3://${props.dataLakeBucket.bucketName}/opentargets/19_11/evidence_data/` 
                    }, 
                    {
                        path: `s3://${props.dataLakeBucket.bucketName}/opentargets/19_11/target_list/`
                    }
                ], 
            }, 
            role: openTargetsGlueRole.roleArn,
            databaseName: open_targets_1911_dl.databaseName,
            schemaChangePolicy: {
                deleteBehavior: "DEPRECATE_IN_DATABASE", 
                updateBehavior: "UPDATE_IN_DATABASE"
            }, 
            tablePrefix: ""
        });
     
		const datalakeEnrollmentWorkflow = new DataLakeEnrollmentWorkflow(this,'openTargetsDataLakeWorkflow',{
			workfowName: "openTargetsDataLakeEnrollmentWorkflow",
			srcCrawler: openTargets_src_crawler,
			etlJob: openTargets_etl_job,
			datalakeCrawler: openTargets_datalake_crawler
			
		})   
        
    }

}