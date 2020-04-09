import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';

export interface DatalakeStackProps extends cdk.StackProps {
    // chemblDB: rds.DatabaseInstance;
    // chemblDBAccessSg: ec2.SecurityGroup;
    // chemblDBSecret: rds.DatabaseSecret;
}

export class DatalakeStack extends cdk.Stack {
  
  public readonly DataLakeBucket: s3.Bucket; 
  
  constructor(scope: cdk.Construct, id: string, props: DatalakeStackProps) {
    super(scope, id, props);

    const dataLakeBucket = new s3.Bucket(this, 'dataLakeBucket');

    this.DataLakeBucket = dataLakeBucket;
  }
}




export interface DataLakeEnrollmentProps extends cdk.StackProps {
	dataLakeBucket: s3.Bucket;
	GlueScriptPath: string;
	GlueScriptArguments: any;
	DataSetName: string;
}

export class DataLakeEnrollment extends cdk.Construct {
  
  public DataEnrollment: DataSetEnrollment; 
  
  constructor(scope: cdk.Construct, id: string, props: DataLakeEnrollmentProps) {
    super(scope, id);
  }
  
	public grantRead(principal: iam.Role){
		
		
		const dataLakeBucket = s3.Bucket.fromBucketName(this, 'dataLakeBucket', this.DataEnrollment.DataLakeBucketName);
		dataLakeBucket.grantRead(principal, this.DataEnrollment.DataLakePrefix + "*")
		
		const gluePolicy = new iam.PolicyStatement({
	        actions: ["glue:GetDatabase"],
	        effect: iam.Effect.ALLOW,
	        resources: [`arn:aws:glue:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:catalog`, 
	        			`arn:aws:glue:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:database/default`, 
	        			this.DataEnrollment.Dataset_Datalake.databaseArn
	        		   ]
	    });    
		
		const athenaPolicy = new iam.PolicyStatement({
	        actions: ["athena:*"],
	        effect: iam.Effect.ALLOW,
	        resources: ["*"],
	    });    
	    
	    principal.addToPolicy(gluePolicy);
	    principal.addToPolicy(athenaPolicy);
		
	
	}
}





