import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import ssm = require('@aws-cdk/aws-ssm');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import sm = require('@aws-cdk/aws-secretsmanager');
import fs = require('fs');




export interface BindingDBBaselineProps extends cdk.StackProps {
  TargetVPC: ec2.Vpc;
  ImportInstance: ec2.Instance;

}


export class BindingDBBaseline extends cdk.Construct {

    public readonly DbAccessSg: ec2.SecurityGroup; 
    public readonly DbSecret: rds.DatabaseSecret;
    public readonly BindingDBDatabaseInstance: rds.DatabaseInstance;
    	
	constructor(scope: cdk.Construct, id: string, props: BindingDBBaselineProps) {
		super(scope, id);
      
        const bindingDBSourceBucket = new s3.Bucket(this, 'BindingDbSourceBucket');
        
        this.DbAccessSg = new ec2.SecurityGroup(this, 'SecGroupChemblAccess', {
            vpc: props.TargetVPC,
            allowAllOutbound: true,
            description: "Grants access to the BindingDb rds instances",
            securityGroupName: "BindingDBAccessSG"
        });
        
        
        const DbSG = new ec2.SecurityGroup(this, 'SecGroupBindingDbSecGroup', {
            vpc: props.TargetVPC,
            allowAllOutbound: true,
            description: "Security group for BindingDB dbs",
            securityGroupName: "BindingDbSG"
        });
        
        const dmzSubnetSelection = { subnetType: ec2.SubnetType.PUBLIC };
        const appSubnetSelection = { subnetType: ec2.SubnetType.PRIVATE };
        const dbSubnetSelection = { subnetType: ec2.SubnetType.ISOLATED };
        
        this.DbAccessSg.addIngressRule( this.DbAccessSg , ec2.Port.allTraffic(),  "Recursive SG rule for Glue" );
        DbSG.addIngressRule( this.DbAccessSg , ec2.Port.tcp(1512),  "Gives BindingDB access security group access to postgres port" );
        
        props.ImportInstance.addSecurityGroup(this.DbAccessSg);
        
        
        
        
        const appSubnets = props.TargetVPC.selectSubnets(appSubnetSelection);
        
        const DbSecret = new rds.DatabaseSecret(this, 'bindingDbSecret', {
            username: 'master',
        });
        this.DbSecret = DbSecret;
        
        
        const cfnSecret = this.DbSecret.node.defaultChild as sm.CfnSecret;
        cfnSecret.addPropertyOverride('GenerateSecretString.ExcludeCharacters', '\'"@-&!/\\;');
        
        this.DbSecret.grantRead(props.ImportInstance.role);
        
        bindingDBSourceBucket.grantReadWrite(props.ImportInstance.role);
        
        const bindingDbOptionGroup = new rds.OptionGroup(this, 'bindingDbRdsOptionGroup',{
            engine: rds.DatabaseInstanceEngine.oracleSe2({
                version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1, 
            }),
            description: "Binding DB Option Group",
            configurations: [{
                name: "S3_INTEGRATION",
                version: "1.0",
            }],
        });
        
        const parameterGroup = new rds.ParameterGroup(this, 'bindingDbRdsParamGroup', {
          engine: rds.DatabaseInstanceEngine.oracleSe2({ version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 }),
          parameters: {
            max_string_size : 'EXTENDED',
          },
        });
        
        const bindingDb = new rds.DatabaseInstance(this, 'bindingDb', {
            engine: rds.DatabaseInstanceEngine.oracleSe2({ version: rds.OracleEngineVersion.VER_19_0_0_0_2020_04_R1 }),
            credentials: rds.Credentials.fromPassword('master', this.DbSecret.secretValueFromJson('password')),
            licenseModel: rds.LicenseModel.BRING_YOUR_OWN_LICENSE,
            vpc: props.TargetVPC,
            vpcPlacement: appSubnetSelection, 
            parameterGroup: parameterGroup,
            optionGroup: bindingDbOptionGroup,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
            instanceIdentifier: 'binding-db',
            securityGroups: [this.DbAccessSg, DbSG],
            deletionProtection: false,
        });
        this.BindingDBDatabaseInstance = bindingDb;
        
        
        
        var bindingDbCfnDb = this.BindingDBDatabaseInstance.node.defaultChild as rds.CfnDBInstance;
        
        const bindingDbRdsImportRole = new iam.Role(this, 'BindingDbRdsInstanceRole', {
            assumedBy: new iam.ServicePrincipal('rds.amazonaws.com')
        });
        bindingDBSourceBucket.grantReadWrite(bindingDbRdsImportRole);
        
        bindingDbCfnDb.associatedRoles = [{
           featureName: "S3_INTEGRATION",
           roleArn: bindingDbRdsImportRole.roleArn
        }];
        
        
        const loadBindingDbDoc = new ssm.CfnDocument(this, 'loadBindingDbDoc', {
            content: JSON.parse(fs.readFileSync('scripts/ssmdoc.importbindingdb.json', { encoding: 'utf-8' })),
            documentType: "Command"
        });


        const instantClientBasic = new s3assets.Asset(this, `instantClientBasicRpm`, {
			path: "baseline_binaries/oracle-instantclient19.8-basic-19.8.0.0.0-1.x86_64.rpm"
		});
		instantClientBasic.grantRead(props.ImportInstance.role);
        const instantClientSqlPlus = new s3assets.Asset(this, `instantClientSqlPlusRpm`, {
			path: "baseline_binaries/oracle-instantclient19.8-sqlplus-19.8.0.0.0-1.x86_64.rpm"
		});
		instantClientSqlPlus.grantRead(props.ImportInstance.role);
        
        
        const loadBindingDbAssociation = new ssm.CfnAssociation(this, 'loadBindingDbAssociation',{
            name: loadBindingDbDoc.ref,
            targets: [
                { key: "InstanceIds", values: [props.ImportInstance.instanceId] }
            ]
        });
        
        loadBindingDbAssociation.addPropertyOverride('Parameters',{
            databaseSecretArn: [this.DbSecret.secretArn],
            databaseHostName: [this.BindingDBDatabaseInstance.dbInstanceEndpointAddress],
            databaseDmpS3Location: [bindingDBSourceBucket.bucketName],
            instantClientBasicS3Path: [instantClientBasic.s3ObjectUrl],
            instantClientSqlPlusS3Path: [instantClientSqlPlus.s3ObjectUrl],
            executionTimeout: ['7201']
        });
        
        
    }
    
 
    
    
}