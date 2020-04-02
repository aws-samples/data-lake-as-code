import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';


export interface S3dataSetEnrollmentProps extends cdk.StackProps {
    sourceBucket: s3.IBucket;
    sourceBucketDataPrefixes: string[];
	dataLakeBucket: s3.Bucket;
	GlueScriptPath: string;
	GlueScriptArguments: any;
	DataSetName: string;
}



export class S3dataSetEnrollment extends cdk.Construct{
	constructor(scope: cdk.Construct, id: string, props: S3dataSetEnrollmentProps) {
		super(scope, id);
	
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
		
		const enrollment = new DataSetEnrollment(this, 'openTargetsEnrollment', {
		    dataLakeBucket: props.dataLakeBucket,
			dataSetName: dataSetName,
			SourceAccessPolicy: s3AccessPolicy,
			SourceTargets: {
                s3Targets: s3TargetPaths, 
            },
			GlueScriptPath: props.GlueScriptPath,
			GlueScriptArguments: props.GlueScriptArguments
		});
	
	}
}