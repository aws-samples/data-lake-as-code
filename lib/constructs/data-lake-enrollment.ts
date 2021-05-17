import { Construct  } from 'constructs';
import { App, Stack, StackProps, Resource} from 'aws-cdk-lib';

import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lakeformation from 'aws-cdk-lib/aws-lakeformation';

import { DataSetEnrollmentProps, DataSetEnrollment } from './data-set-enrollment';




export class DataLakeEnrollment extends Construct {

    public DataEnrollment: DataSetEnrollment;
    public DataSetName: string;
    public CoarseAthenaAccessPolicy: iam.ManagedPolicy;
    private CoarseResourceAccessPolicy: iam.ManagedPolicy;
    private CoarseIamPolciesApplied: boolean;
    private WorkflowCronScheduleExpression?: string;
    

    constructor(scope: Construct, id: string, props: DataLakeEnrollment.DataLakeEnrollmentProps) {
        super(scope, id);


        this.DataSetName = props.DataSetName;
        this.CoarseIamPolciesApplied = false;
        this.WorkflowCronScheduleExpression = props.WorkflowCronScheduleExpression;

    }
 
    grantGlueRoleLakeFormationPermissions(DataSetGlueRole: iam.Role, DataSetName: string) {

        this.grantDataLocationPermissions(this.DataEnrollment.DataSetGlueRole, {
            Grantable: true,
            GrantResourcePrefix: `${DataSetName}locationGrant`,
            Location: this.DataEnrollment.DataLakeBucketName,
            LocationPrefix: this.DataEnrollment.DataLakePrefix
        });
        
        this.grantDatabasePermission(this.DataEnrollment.DataSetGlueRole,  {		     
		     DatabasePermissions: [DataLakeEnrollment.DatabasePermission.All],
             GrantableDatabasePermissions: [DataLakeEnrollment.DatabasePermission.All],
             GrantResourcePrefix: `${DataSetName}RoleGrant`
		}, true);
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
                `arn:aws:glue:${Stack.of(this).region}:${Stack.of(this).account}:catalog`,
                `arn:aws:glue:${Stack.of(this).region}:${Stack.of(this).account}:database/default`,
                this.DataEnrollment.Dataset_Datalake.ref,
                `arn:aws:glue:${Stack.of(this).region}:${Stack.of(this).account}:table/${this.DataEnrollment.Dataset_Datalake.getAtt('DatabaseInput.Name').toString()}/*`
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
                `arn:aws:athena:${Stack.of(this).region}:${Stack.of(this).account}:*`
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

    public grantDataLocationPermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.DataLocationGrant , sourceLakeFormationLocation?: lakeformation.CfnResource ){
        
        
        
        var grantIdPrefix = ""
        var dataLakePrincipal : lakeformation.CfnPermissions.DataLakePrincipalProperty = {
            dataLakePrincipalIdentifier: ""
        };
        
        
        var s3Arn = `arn:aws:s3:::${permissionGrant.Location}${permissionGrant.LocationPrefix}` ;
        
        var dataLocationProperty : lakeformation.CfnPermissions.ResourceProperty = {
            dataLocationResource: {
                s3Resource: s3Arn            
            }            
        };
        const resolvedPrincipalType = this.determinePrincipalType(principal);

        if(resolvedPrincipalType === iam.Role) {
            const resolvedPrincipal = principal as  iam.Role;

            if(permissionGrant.GrantResourcePrefix){
                grantIdPrefix = `${permissionGrant.GrantResourcePrefix}-${this.DataSetName}`
            }else{
                grantIdPrefix = `${resolvedPrincipal.roleName}-${this.DataSetName}`
            }            
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.roleArn };
		}

	    if(resolvedPrincipalType === iam.User){
            const resolvedPrincipal = principal as  iam.User;
            grantIdPrefix = `${resolvedPrincipal.userName}-${this.DataSetName}`
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.userArn };
		}


        if(permissionGrant.Grantable){
            const locationPermission = this.createLakeFormationPermission(`${grantIdPrefix}-locationGrant`,dataLakePrincipal , dataLocationProperty, ['DATA_LOCATION_ACCESS'], ['DATA_LOCATION_ACCESS']);
            
            if (sourceLakeFormationLocation != null ) {
                locationPermission.addDependsOn(sourceLakeFormationLocation);
            }
            
        }else {
            const locationPermission = this.createLakeFormationPermission(`${grantIdPrefix}-locationGrant`,dataLakePrincipal , dataLocationProperty, ['DATA_LOCATION_ACCESS'], ['']);
            if (sourceLakeFormationLocation != null ) {
                locationPermission.addDependsOn(sourceLakeFormationLocation);
            }
        }                


    }

    public grantTableWithColumnPermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.TableWithColumnPermissionGrant){

        const coreGrant = this.setupIamAndLakeFormationDatabasePermissionForPrincipal(principal, permissionGrant.DatabasePermissions, permissionGrant.GrantableDatabasePermissions);

        const wildcardProperty: lakeformation.CfnPermissions.ColumnWildcardProperty = {
            excludedColumnNames: permissionGrant.columns
        };


        const databaseName = this.DataEnrollment.Dataset_Datalake.getAtt('DatabaseInput.Name').toString();

        var  tableWithColumnsProperty : lakeformation.CfnPermissions.TableWithColumnsResourceProperty = {
            columnNames: permissionGrant.columns,
            databaseName: databaseName,
            name: permissionGrant.table
        };

        if(permissionGrant.wildCardFilter === null){
            tableWithColumnsProperty = {
                columnNames: permissionGrant.columns,
                databaseName: databaseName,
                name: permissionGrant.table
            };
        }else{

            if(permissionGrant.wildCardFilter == DataLakeEnrollment.TableWithColumnFilter.Include){
                tableWithColumnsProperty = {
                    columnNames: permissionGrant.columns,
                    databaseName: databaseName,
                    name: permissionGrant.table
                };
            }

            if(permissionGrant.wildCardFilter == DataLakeEnrollment.TableWithColumnFilter.Exclude){
                tableWithColumnsProperty = {
                    databaseName: databaseName,
                    name: permissionGrant.table,
                    columnWildcard: {
                        excludedColumnNames: permissionGrant.columns
                    }
                };
            }

        }

        const tableWithColumnResourceProperty : lakeformation.CfnPermissions.ResourceProperty = {
            tableWithColumnsResource: tableWithColumnsProperty
        };

        this.createLakeFormationPermission(`${coreGrant.grantIdPrefix}-${permissionGrant.table}-databaseTableWithColumnGrant`,coreGrant.dataLakePrincipal , tableWithColumnResourceProperty, permissionGrant.TableColumnPermissions, permissionGrant.GrantableTableColumnPermissions)


    }

    public grantDatabasePermission(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.DatabasePermissionGrant, includeSourceDb: boolean = false){

        const databaseName = this.DataEnrollment.Dataset_Datalake.getAtt('DatabaseInput.Name').toString();
        var grantIdPrefix = ""
        var dataLakePrincipal : lakeformation.CfnPermissions.DataLakePrincipalProperty = {
            dataLakePrincipalIdentifier: ""
        };
        var databaseResourceProperty : lakeformation.CfnPermissions.ResourceProperty = {            
            databaseResource: {name: databaseName}
        };

        const resolvedPrincipalType = this.determinePrincipalType(principal);

        if(resolvedPrincipalType === iam.Role) {
            const resolvedPrincipal = principal as  iam.Role;

            if(permissionGrant.GrantResourcePrefix){
                grantIdPrefix = `${permissionGrant.GrantResourcePrefix}-${this.DataSetName}`
            }else{
                grantIdPrefix = `${resolvedPrincipal.roleName}-${this.DataSetName}`
            }            
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.roleArn };
		}

	    if(resolvedPrincipalType === iam.User){
            const resolvedPrincipal = principal as  iam.User;
            grantIdPrefix = `${resolvedPrincipal.userName}-${this.DataSetName}`
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.userArn };
		}

        this.createLakeFormationPermission(`${grantIdPrefix}-databaseGrant`,dataLakePrincipal , databaseResourceProperty, permissionGrant.DatabasePermissions, permissionGrant.GrantableDatabasePermissions)

        if(includeSourceDb){

            databaseResourceProperty = {
                //dataLocationResource: {resourceArn: this.DataEnrollment.DataLakeBucketName},
                databaseResource: {name: databaseName}
            };

            this.createLakeFormationPermission(`${grantIdPrefix}-databaseSrcGrant`,dataLakePrincipal , databaseResourceProperty, permissionGrant.DatabasePermissions, permissionGrant.GrantableDatabasePermissions)

        }


    }


    public grantTablePermissions(principal: iam.IPrincipal, permissionGrant: DataLakeEnrollment.TablePermissionGrant){
        
        const coreGrant = this.setupIamAndLakeFormationDatabasePermissionForPrincipal(principal, permissionGrant.DatabasePermissions, permissionGrant.GrantableDatabasePermissions);
        const databaseName = this.DataEnrollment.Dataset_Datalake.getAtt('DatabaseInput.Name').toString();
        permissionGrant.tables.forEach(table => {
            var tableResourceProperty : lakeformation.CfnPermissions.ResourceProperty = {
                tableResource:{
                    name: table,
                    databaseName: databaseName
                }
            };
            this.createLakeFormationPermission(`${coreGrant.grantIdPrefix}-${table}-databaseTableGrant`,coreGrant.dataLakePrincipal , tableResourceProperty, permissionGrant.TablePermissions, permissionGrant.GrantableTablePermissions)
        });

    }


	public grantCoarseIamRead(principal: iam.IPrincipal){


        const resolvedPrincipalType = this.determinePrincipalType(principal);
        
        
        
		if(resolvedPrincipalType === iam.Role){
		    this.CoarseAthenaAccessPolicy.attachToRole(principal as iam.Role);
		    this.CoarseResourceAccessPolicy.attachToRole(principal as iam.Role);
		    this.CoarseIamPolciesApplied = true;
		    return;
		}

	    if(resolvedPrincipalType === iam.User){
		    this.CoarseAthenaAccessPolicy.attachToUser(principal as iam.User);
		    this.CoarseResourceAccessPolicy.attachToUser(principal as iam.User);
		    this.CoarseIamPolciesApplied = true;
		    return;
		}



	}



	private createLakeFormationPermission(resourceId: string, dataLakePrincipal: lakeformation.CfnPermissions.DataLakePrincipalProperty, resource: lakeformation.CfnPermissions.ResourceProperty, permissions: string[], grantablePremissions: string[] ){
        return new lakeformation.CfnPermissions(this, resourceId, {
            dataLakePrincipal: dataLakePrincipal,
            resource: resource,
            permissions: permissions,
            permissionsWithGrantOption: grantablePremissions
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

		if(principal instanceof Resource){

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
	private setupIamAndLakeFormationDatabasePermissionForPrincipal(principal: iam.IPrincipal, databasePermissions: Array<DataLakeEnrollment.DatabasePermission>, grantableDatabasePermissions: Array<DataLakeEnrollment.DatabasePermission> ){

        this.grantCoarseIamRead(principal);
        const databaseName = this.DataEnrollment.Dataset_Datalake.getAtt('DatabaseInput.Name').toString();
        
        var grantIdPrefix = ""
        var dataLakePrincipal : lakeformation.CfnPermissions.DataLakePrincipalProperty = {
            dataLakePrincipalIdentifier: ""
        };
        var databaseResourceProperty : lakeformation.CfnPermissions.ResourceProperty = {
            //dataLocationResource: {resourceArn: this.DataEnrollment.DataLakeBucketName},
            databaseResource: {name: databaseName}
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
            dataLakePrincipal = { dataLakePrincipalIdentifier: resolvedPrincipal.userArn };
		}

	    this.grantDatabasePermission(principal, { DatabasePermissions: databasePermissions, GrantableDatabasePermissions: grantableDatabasePermissions  });

        return { grantIdPrefix: grantIdPrefix, dataLakePrincipal: dataLakePrincipal };
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

    export enum TableWithColumnFilter {
        Include = "Include",
        Exclude = "Exclude"
    }

    export interface DataLakeEnrollmentProps extends StackProps {
    	dataLakeBucket: s3.Bucket;
    	GlueScriptPath: string;
    	GlueScriptArguments: any;
    	DataSetName: string;
    	WorkflowCronScheduleExpression?: string;
    }

    export interface DatabasePermissionGrant {
        DatabasePermissions: Array<DatabasePermission>;
        GrantableDatabasePermissions: Array<DatabasePermission>;
        GrantResourcePrefix?: string;
    }

    export interface DataLocationGrant{
        Grantable: boolean;
        GrantResourcePrefix?: string;
        Location: string;
        LocationPrefix: string;
    }

    export interface TablePermissionGrant {
        tables: Array<string>;
        DatabasePermissions: Array<DatabasePermission>;
        GrantableDatabasePermissions: Array<DatabasePermission>;
        TablePermissions: Array<TablePermission>;
        GrantableTablePermissions: Array<TablePermission>;
    }

    export interface TableWithColumnPermissionGrant {
        table: string;
        columns: Array<string>;
        wildCardFilter?: TableWithColumnFilter;
        DatabasePermissions: Array<DatabasePermission>;
        GrantableDatabasePermissions: Array<DatabasePermission>;
        TableColumnPermissions: Array<TablePermission>;
        GrantableTableColumnPermissions: Array<TablePermission>;
    }
}



