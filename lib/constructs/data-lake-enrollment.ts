import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import glue = require('@aws-cdk/aws-glue');
import s3 = require('@aws-cdk/aws-s3');
import lakeformation = require('@aws-cdk/aws-lakeformation');
import s3assets = require('@aws-cdk/aws-s3-assets');
import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';




export class DataLakeEnrollment extends cdk.Construct {

  public DataEnrollment: DataSetEnrollment;
  public DataSetName: string;
  private CoarseAthenaAccessPolicy: iam.ManagedPolicy;
  private CoarseResourceAccessPolicy: iam.ManagedPolicy;

  constructor(scope: cdk.Construct, id: string, props: DataLakeEnrollment.DataLakeEnrollmentProps) {
        super(scope, id);


        this.DataSetName = props.DataSetName;

    }

    public createCoarseIamPolicy(){

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
                "athena:ListTagsForResource",
                "athena:StartQueryExecution"
            ],
            "Resource": [
                `arn:aws:athena:${cdk.Stack.of(this).region}:${cdk.Stack.of(this).account}:*`
            ],
            "Effect": "Allow"
        };

    	const athenaPolicyStatement = iam.PolicyStatement.fromJson(athenaPolicy);

    	//https://docs.aws.amazon.com/lake-formation/latest/dg/cloudtrail-tut-create-lf-user.html
    	const lakeFormationPolicy = {
            "Effect": "Allow",
            "Action": [
                "lakeformation:GetDataAccess",
                "glue:GetTable",
                "glue:GetTables",
                "glue:SearchTables",
                "glue:GetDatabase",
                "glue:GetDatabases",
                "glue:GetPartitions"
            ],
            "Resource": "*"
        };

    	const coarseLakeFormationPolicy = iam.PolicyStatement.fromJson(lakeFormationPolicy);

    	const policyParams = {
    	  policyName: `${this.DataSetName}-coarseIamDataLakeAccessPolicy`,
    	  statements: [s3PolicyStatement,gluePolicyStatement, athenaPolicyStatement, coarseLakeFormationPolicy]
        }

	    this.CoarseResourceAccessPolicy = new iam.ManagedPolicy(this, `${this.DataSetName}-coarseIamDataLakeAccessPolicy`, policyParams );


	    // This is effectively the same as the AWS Managed Policy AthenaFullAccess
	    const coarseAthenaAccess = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "athena:*"
                    ],
                    "Resource": [
                        "*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "glue:CreateDatabase",
                        "glue:DeleteDatabase",
                        "glue:GetDatabase",
                        "glue:GetDatabases",
                        "glue:UpdateDatabase",
                        "glue:CreateTable",
                        "glue:DeleteTable",
                        "glue:BatchDeleteTable",
                        "glue:UpdateTable",
                        "glue:GetTable",
                        "glue:GetTables",
                        "glue:BatchCreatePartition",
                        "glue:CreatePartition",
                        "glue:DeletePartition",
                        "glue:BatchDeletePartition",
                        "glue:UpdatePartition",
                        "glue:GetPartition",
                        "glue:GetPartitions",
                        "glue:BatchGetPartition"
                    ],
                    "Resource": [
                        "*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketLocation",
                        "s3:GetObject",
                        "s3:ListBucket",
                        "s3:ListBucketMultipartUploads",
                        "s3:ListMultipartUploadParts",
                        "s3:AbortMultipartUpload",
                        "s3:CreateBucket",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        "arn:aws:s3:::aws-athena-query-results-*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        "arn:aws:s3:::athena-examples*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket",
                        "s3:GetBucketLocation",
                        "s3:ListAllMyBuckets"
                    ],
                    "Resource": [
                        "*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:ListTopics",
                        "sns:GetTopicAttributes"
                    ],
                    "Resource": [
                        "*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricAlarm",
                        "cloudwatch:DescribeAlarms",
                        "cloudwatch:DeleteAlarms"
                    ],
                    "Resource": [
                        "*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "lakeformation:GetDataAccess"
                    ],
                    "Resource": [
                        "*"
                    ]
                }
            ]
        };

        const coarseAthenaAccessPolicyDoc = iam.PolicyDocument.fromJson(coarseAthenaAccess);

	    this.CoarseAthenaAccessPolicy = new iam.ManagedPolicy(this, `${this.DataSetName}-coarseIamAthenaAccessPolicy`, {
	       document: coarseAthenaAccessPolicyDoc,
	       description: `${this.DataSetName}-coarseIamAthenaAccessPolicy`,
        });

    }


    private createLakeFormationPermission(resourceId: string, dataLakePrincipal: lakeformation.CfnPermissions.DataLakePrincipalProperty,
                                          resource: lakeformation.CfnPermissions.ResourceProperty, permissions: string[], grantablePremissions: string[] ){
       
        new lakeformation.CfnPermissions(this, resourceId, {
            dataLakePrincipal: dataLakePrincipal,
            resource: resource,
            permissions: permissions,
            permissionsWithGrantOption: grantablePremissions
        });
    }

    public grantLakeFormationPermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.LakeFormationPermissionGrant){
       

        this.grantCoarseIamRead(principal);

        var grantIdPrefix = ""
        var dataLakePrincipal : lakeformation.CfnPermissions.DataLakePrincipalProperty = {
            dataLakePrincipalIdentifier: ""
        };
        var databaseResourceProperty : lakeformation.CfnPermissions.ResourceProperty = {
            //dataLocationResource: {resourceArn: this.DataEnrollment.DataLakeBucketName},
            databaseResource: {name: this.DataEnrollment.Dataset_Datalake.databaseName}
        };

        const resolvedPrincipalType = this.determinePrincipalType(principal);

        if(resolvedPrincipalType === iam.Role) {
            const resolvedPrincipal = principal as  iam.Role;
            grantIdPrefix = `${resolvedPrincipal.roleArn}-${this.DataSetName}`
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.roleArn };
		}

	    if(resolvedPrincipalType === iam.User){
            const resolvedPrincipal = principal as  iam.User;
            grantIdPrefix = `${resolvedPrincipal.userName}-${this.DataSetName}`
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.userName };
		}

		this.createLakeFormationPermission(`${grantIdPrefix}-databaseGrant`,dataLakePrincipal , databaseResourceProperty, permissionGrant.DatabasePermissions, permissionGrant.GrantableDatabasePermissions)

        permissionGrant.tables.forEach(table => {
            var tableResourceProperty : lakeformation.CfnPermissions.ResourceProperty = {
                tableResource:{
                    name: table,
                    databaseName: this.DataEnrollment.Dataset_Datalake.databaseName
                }
            };
            this.createLakeFormationPermission(`${grantIdPrefix}-${table}-databaseTableGrant`,dataLakePrincipal , tableResourceProperty, permissionGrant.TablePermissions, permissionGrant.TablePermissions)
        });

    }

    private determinePrincipalType(principal: iam.IPrincipal){        

        if(principal instanceof iam.Role){
            //return principal as iam.Role;
            return iam.Role;            
		}

	    if(principal instanceof iam.User){
            //return principal as iam.User;
            return iam.User;
		}

		if(principal instanceof cdk.Resource){
            
	        try{
                const user = principal as iam.User;                          
                return iam.User;
	        } catch(exception) {
	            console.log(exception);
	        }
	        try{
                const role = principal as iam.Role;
                return iam.Role; 
	        } catch(exception) {
	            console.log(exception);
	        }
        }
        
        throw("Unable to deterimine principal type...");

    }
    

	public grantCoarseIamRead(principal: iam.IPrincipal){

        const resolvedPrincipalType = this.determinePrincipalType(principal);

		if(resolvedPrincipalType === iam.Role){            
		    this.CoarseAthenaAccessPolicy.attachToRole(principal as iam.Role);
		    this.CoarseResourceAccessPolicy.attachToRole(principal as iam.Role);
		    return;
		}

	    if(resolvedPrincipalType === iam.User){
		    this.CoarseAthenaAccessPolicy.attachToUser(principal as iam.User);
		    this.CoarseResourceAccessPolicy.attachToUser(principal as iam.User);
		    return;
		}
		
		throw("Unable to attach policy. Principal is not a user or role.");

	}
}



export namespace DataLakeEnrollment
{
    export enum DatabasePermission {
        All = 'ALL',
        Alter = 'ALTER',
        Drop = 'DROP',
        CreateTable = 'CREATE_TABLE',
        //DataLocationAccess= 'DATA_LOCATION_ACCESS'
    }

    export enum TablePermission {
        All = 'ALL',
        Select = 'SELECT',
        Alter = 'ALTER',
        Drop = 'DROP',
        Delete = 'DELETE',
        Insert = 'INSERT',
    }

    export interface DataLakeEnrollmentProps extends cdk.StackProps {
    	dataLakeBucket: s3.Bucket;
    	GlueScriptPath: string;
    	GlueScriptArguments: any;
    	DataSetName: string;
    }

    export interface LakeFormationPermissionGrant {
        tables: Array<string>;
        DatabasePermissions: Array<DatabasePermission>;
        GrantableDatabasePermissions: Array<DatabasePermission>;
        TablePermissions: Array<TablePermission>;
        GrantableTablePermissions: Array<TablePermission>;
    }
}



