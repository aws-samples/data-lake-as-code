import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import ssm = require('@aws-cdk/aws-ssm');
import s3 = require('@aws-cdk/aws-s3');
import s3assets = require('@aws-cdk/aws-s3-assets');
import fs = require('fs');




export class BaselineStack extends cdk.Stack {
    
    public readonly ChemblDb: rds.DatabaseInstance;
    public readonly chemblDBChemblDbAccessSg: ec2.SecurityGroup;
    public readonly chemblDBSecret: rds.DatabaseSecret; 
    public readonly OpenTargetsSourceBucket: s3.Bucket; 
    public readonly Vpc: ec2.Vpc;
    public readonly BindingDBSourceBucket: s3.Bucket;
    public readonly BindingDb: rds.DatabaseInstance;
    public readonly BindingDBAccessSg: ec2.SecurityGroup;
    public readonly BindingDBSecret: rds.DatabaseSecret;
    
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        
        super(scope, id, props);
        
        const baselineVpc = new ec2.Vpc(this, "coreVpc", {
              cidr: "10.80.0.0/16",
              subnetConfiguration: [
               {
                 cidrMask: 20,
                 name: 'dmz',
                 subnetType: ec2.SubnetType.PUBLIC,
               },
               {
                 cidrMask: 20,
                 name: 'application',
                 subnetType: ec2.SubnetType.PRIVATE,
               },
               {
                 cidrMask: 20,
                 name: 'database',
                 subnetType: ec2.SubnetType.ISOLATED,
               }, 
            ]
        });    
        
        this.Vpc = baselineVpc;
        
        const chemblAccessSG = new ec2.SecurityGroup(this, 'chemblAccessSg', {
            vpc: baselineVpc,
            allowAllOutbound: true,
            description: "Grants access to the chembl25 rds instance",
            securityGroupName: "ChemblAccessSecurityGroup"
        });
        
        this.chemblDBChemblDbAccessSg = chemblAccessSG;
        
        const chemblDbSG = new ec2.SecurityGroup(this, 'chemblDbSG', {
            vpc: baselineVpc,
            allowAllOutbound: true,
            description: "Security group for chembl dbs",
            securityGroupName: "ChemblDbSecurityGroup"
        });
        
        chemblAccessSG.addIngressRule( chemblAccessSG , ec2.Port.allTraffic(),  "Recursive SG rule for Glue" );
        chemblDbSG.addIngressRule( chemblAccessSG , ec2.Port.tcp(5432),  "Gives chembl access security group access to postgres port" );
        
        const dmzSubnetSelection = { subnetType: ec2.SubnetType.PUBLIC };
        const appSubnetSelection = { subnetType: ec2.SubnetType.PRIVATE };
        const dbSubnetSelection = { subnetType: ec2.SubnetType.ISOLATED };
        
        baselineVpc.addS3Endpoint('s3Endpoint', [dmzSubnetSelection,appSubnetSelection,dbSubnetSelection  ] );
        
        
        const appSubnets = baselineVpc.selectSubnets(appSubnetSelection);
        
        const chemblDBSecret = new rds.DatabaseSecret(this, 'chembldbSecret', {
            username: 'master',
        });
        this.chemblDBSecret = chemblDBSecret;
        
        
        const chemblDb = new rds.DatabaseInstance(this, 'chembl25', {
            engine: rds.DatabaseInstanceEngine.POSTGRES,
            credentials: rds.Credentials.fromPassword('master',chemblDBSecret.secretValueFromJson('password')),
            vpc: baselineVpc,
            vpcPlacement: appSubnetSelection, 
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            instanceIdentifier: 'chembl-25-00',
            securityGroups: [chemblDbSG],
            deletionProtection: false
        });
        
        
        this.ChemblDb = chemblDb;
        
        
        const importInstanceRole = new iam.Role(this, 'importInstanceRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
        });
        
        importInstanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        importInstanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'));
        
        chemblDBSecret.grantRead(importInstanceRole);
        
        const importInstance = new ec2.Instance(this, 'importInstance2', {
            
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.LARGE),
            machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
            vpc: baselineVpc,
            vpcSubnets: appSubnetSelection,
            securityGroup: chemblAccessSG,
            instanceName: "ChemblDbImportInstance",
            role: importInstanceRole,
            blockDevices:[{
                deviceName: '/dev/xvda',
                volume: ec2.BlockDeviceVolume.ebs(50),
            }]
            
        });
        
        
        
        
        const loadChemblDbDoc = new ssm.CfnDocument(this, 'loadChemblDbDoc', {
            content: JSON.parse(fs.readFileSync('scripts/ssmdoc.importchembl25.json', { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        
        
        const loadChemblAssociation = new ssm.CfnAssociation(this, 'loadChemblAssociation',{
            name: loadChemblDbDoc.ref,
            targets: [
                { key: "InstanceIds", values: [importInstance.instanceId] }
            ]
        });
        
        loadChemblAssociation.addPropertyOverride('Parameters',{
            databaseSecretArn: [chemblDBSecret.secretArn],
            databaseHostName: [chemblDb.dbInstanceEndpointAddress],
            executionTimeout: ['7200']
        });
        
        
        
        
        const openTargetsBucket = new s3.Bucket(this, 'openTargetsBucket');
        this.OpenTargetsSourceBucket = openTargetsBucket;
        
        this.OpenTargetsSourceBucket.grantReadWrite(importInstanceRole);
        
        const loadOpenTargetsDoc = new ssm.CfnDocument(this, 'loadOpenTargetsDoc', {
            content: JSON.parse(fs.readFileSync('scripts/ssmdoc.import.opentargets.1911.json', { encoding: 'utf-8' })),
            documentType: "Command"
        });
        
        const loadOpenTargetsAssociation = new ssm.CfnAssociation(this, 'loadOpenTargetsAssociation',{
            name: loadOpenTargetsDoc.ref,
            targets: [
                { key: "InstanceIds", values: [importInstance.instanceId] }
            ]
        });
        
        loadOpenTargetsAssociation.addPropertyOverride('Parameters',{
            openTargetsSourceFileTargetBucketLocation: [openTargetsBucket.bucketName]
        });
        
        //// Start Binding DB  ////
        
        const bindingDbAccessSg = new ec2.SecurityGroup(this, 'bindingDbAccessSg', {
            vpc: baselineVpc,
            allowAllOutbound: true,
            description: "Grants access to the BindingDB rds instance",
            securityGroupName: "BindingDBAccessSecurityGroup"
        });
        
        this.BindingDBSourceBucket = new s3.Bucket(this, 'BindingDbSourceBucket');
        
        this.BindingDBAccessSg = bindingDbAccessSg;
        
        const bindingDbSg = new ec2.SecurityGroup(this, 'bindingDbSg', {
            vpc: baselineVpc,
            allowAllOutbound: true,
            description: "Security group for binding dbs",
            securityGroupName: "BindingDbSecurityGroup"
        });
        
        

        
        bindingDbAccessSg.addIngressRule( bindingDbAccessSg , ec2.Port.allTraffic(),  "Recursive SG rule for Glue" );
        
        bindingDbSg.addIngressRule( bindingDbAccessSg , ec2.Port.tcp(1512),  "Gives BindingDB access security group access to oracle port" );
        
        importInstance.addSecurityGroup(bindingDbAccessSg);
        
        
        const bindingDBSecret = new rds.DatabaseSecret(this, 'bindingDbSecret', {
            username: 'master',
        });
        this.BindingDBSecret = bindingDBSecret;
        
        bindingDBSecret.grantRead(importInstanceRole);
        this.BindingDBSourceBucket.grantReadWrite(importInstanceRole);
        
        
        const bindingDbOptionGroup = new rds.OptionGroup(this, 'bindingDbRdsOptionGroup',{
            engine: rds.DatabaseInstanceEngine.oracleSe2({
                version: rds.OracleEngineVersion.VER_19, // different version class for each engine type
            }),
            description: "Binding DB Option Group",
            configurations: [{
                name: "S3_INTEGRATION",
                version: "1.0"
            }],
        });
        
        const bindingDb = new rds.DatabaseInstance(this, 'bindingDb', {
            engine: rds.DatabaseInstanceEngine.ORACLE_SE2,
            credentials: rds.Credentials.fromPassword('master',chemblDBSecret.secretValueFromJson('password')),
            licenseModel: rds.LicenseModel.BRING_YOUR_OWN_LICENSE,
            vpc: baselineVpc,
            vpcPlacement: appSubnetSelection, 
            optionGroup: bindingDbOptionGroup,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
            instanceIdentifier: 'binding-db',
            securityGroups: [bindingDbSg, bindingDbAccessSg],
            deletionProtection: false,
        });
        this.BindingDb = bindingDb;
        
        var bindingDbCfnDb = this.BindingDb.node.defaultChild as rds.CfnDBInstance;
        
        const bindingDbRdsImportRole = new iam.Role(this, 'BindingDbRdsInstanceRole', {
            assumedBy: new iam.ServicePrincipal('rds.amazonaws.com')
        });
        this.BindingDBSourceBucket.grantReadWrite(bindingDbRdsImportRole);
        
        bindingDbCfnDb.associatedRoles = [{
           featureName: "S3_INTEGRATION",
           roleArn: bindingDbRdsImportRole.roleArn
        }];
        
        
        const loadBindingDbDoc = new ssm.CfnDocument(this, 'loadBindingDbDoc', {
            content: JSON.parse(fs.readFileSync('scripts/ssmdoc.importbindingdb.json', { encoding: 'utf-8' })),
            documentType: "Command"
        });


        const instantClientBasic = new s3assets.Asset(this, `instantClientBasicRpm`, {
			path: "oracle-instantclient19.8-basic-19.8.0.0.0-1.x86_64.rpm"
		});
		instantClientBasic.grantRead(importInstanceRole);
        const instantClientSqlPlus = new s3assets.Asset(this, `instantClientSqlPlusRpm`, {
			path: "oracle-instantclient19.8-sqlplus-19.8.0.0.0-1.x86_64.rpm"
		});
		instantClientSqlPlus.grantRead(importInstanceRole);
        
        
        const loadBindingDbAssociation = new ssm.CfnAssociation(this, 'loadBindingDbAssociation',{
            name: loadBindingDbDoc.ref,
            targets: [
                { key: "InstanceIds", values: [importInstance.instanceId] }
            ]
        });
        
        loadBindingDbAssociation.addPropertyOverride('Parameters',{
            databaseSecretArn: [this.BindingDBSecret.secretArn],
            databaseHostName: [this.BindingDb.dbInstanceEndpointAddress],
            databaseDmpS3Location: [this.BindingDBSourceBucket.bucketName],
            instantClientBasicS3Path: [instantClientBasic.s3ObjectUrl],
            instantClientSqlPlusS3Path: [instantClientSqlPlus.s3ObjectUrl],
            executionTimeout: ['7200']
        });
        
        //// End Binding DB  ////
        
   }
   
   
}
