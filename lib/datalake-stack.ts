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
		
		
		const s3Policy = {
				"Action": [
            "s3:GetObject*",
            "s3:GetBucket*",
            "s3:List*"
        ],
        "Resource": [
            `arn:aws:s3:::${this.DataEnrollment.DataLakeBucketName}`,
            `arn:aws:s3:::${this.DataEnrollment.DataLakeBucketName}${this.DataEnrollment.DataLakePrefix}*`
        ],
        "Effect": "Allow"
			};
			
			
    const s3PolicyStatement = iam.PolicyStatement.fromJson(s3Policy);
    
		const gluePolicy = {
					"Action": [
              "glue:GetDatabase",
              "glue:GetTable",
          ],
          "Resource": [
              `arn:aws:glue:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:catalog`,
              `arn:aws:glue:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:database/default`,
              this.DataEnrollment.Dataset_Datalake.databaseArn,
              `arn:aws:glue:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:table/${this.DataEnrollment.Dataset_Datalake.databaseName}/*`
          ],
          "Effect": "Allow"
			};
    const gluePolicyStatement = iam.PolicyStatement.fromJson(gluePolicy);


		const athenaPolicy = {
					"Action": [
						"athena:BatchGetNamedQuery",
						"athena:BatchGetQueryExecution",
						"athena:GetQueryExecution",
						"athena:GetQueryResults",
						"athena:GetQueryResultsStream",
						"athena:GetWorkGroup",
						"athena:ListTagsForResource"
          ],
          "Resource": [
              `arn:aws:athena:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`
              
          ],
          "Effect": "Allow"
			};
		const athenaPolicyStatement = iam.PolicyStatement.fromJson(athenaPolicy);
		
		
    
		principal.addToPolicy(gluePolicyStatement);
		principal.addToPolicy(s3PolicyStatement);
    principal.addToPolicy(athenaPolicyStatement);
	    
		
	
	}
}





