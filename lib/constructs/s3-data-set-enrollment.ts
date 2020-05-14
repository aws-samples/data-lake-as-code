import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';
import { DataLakeEnrollment } from './data-lake-enrollment';


export interface S3dataSetEnrollmentProps extends DataLakeEnrollment.DataLakeEnrollmentProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefixes: string[];
}



export class S3dataSetEnrollment extends DataLakeEnrollment{
	constructor(scope: cdk.Construct, id: string, props: S3dataSetEnrollmentProps) {
		super(scope, id, props);
	
		const dataSetName = props.DataSetName;
		
		const s3AccessPolicy = new iam.Policy(this, 'dataSourceAccessPolicy');
		
		let s3TargetPaths = new Array<glue.CfnCrawler.S3TargetProperty>();
		
        const bucketListPolicy = new iam.PolicyStatement({
            actions: ["s3:ListBucket"],
            effect: iam.Effect.ALLOW,
            resources: [`arn:aws:s3:::${props.sourceBucket.bucketName}`]
        });   
		s3AccessPolicy.addStatements(bucketListPolicy);
		
        for(let bucketPrefix of props.sourceBucketDataPrefixes){
            s3TargetPaths.push({
                path: `s3://${props.sourceBucket.bucketName}${bucketPrefix}`
            })
            
            const prefixAccessPolicy = new iam.PolicyStatement({
                actions: ["s3:GetObject"],
                effect: iam.Effect.ALLOW,
                resources: [`arn:aws:s3:::${props.sourceBucket.bucketName}${bucketPrefix}*`]
            });    
            
            s3AccessPolicy.addStatements(prefixAccessPolicy);
            
        }
		
		this.DataEnrollment = new DataSetEnrollment(this, `${props.DataSetName}-s3Enrollment`, {
		    dataLakeBucket: props.dataLakeBucket,
			dataSetName: dataSetName,
			SourceAccessPolicy: s3AccessPolicy,
			SourceTargets: {
                s3Targets: s3TargetPaths, 
            },
			GlueScriptPath: props.GlueScriptPath,
			GlueScriptArguments: props.GlueScriptArguments
		});
	
        this.createCoarseIamPolicy();
        

        this.grantDatabasePermission(this.DataEnrollment.DataSetGlueRole,  {		     
		     DatabasePermissions: [DataLakeEnrollment.DatabasePermission.All],
             GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.All],
             GrantResourcePrefix: `${props.DataSetName}RoleGrant`
		}, true);


	}
}