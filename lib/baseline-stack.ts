import * as cdk from '@aws-cdk/core';
import ec2 = require('@aws-cdk/aws-ec2');
import iam = require('@aws-cdk/aws-iam');
import rds = require('@aws-cdk/aws-rds');
import ssm = require('@aws-cdk/aws-ssm');
import s3 = require('@aws-cdk/aws-s3');
import fs = require('fs');




export class BaselineStack extends cdk.Stack {
    
    public readonly ChemblDb: rds.DatabaseInstance;
    public readonly chemblDBChemblDbAccessSg: ec2.SecurityGroup;
    public readonly chemblDBSecret: rds.DatabaseSecret; 
    public readonly OpenTargetsSourceBucket: s3.Bucket; 
    
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
            masterUsername: 'master',
            vpc: baselineVpc,
            vpcPlacement: appSubnetSelection,
            instanceClass: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
            instanceIdentifier: 'chembl-25-00',
            masterUserPassword: chemblDBSecret.secretValueFromJson('password'),
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
            databaseHostName: [chemblDb.dbInstanceEndpointAddress]
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
        
        
   }
}
