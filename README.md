# Data Lake as Code; Featuring ChEMBL and Open Targets

Companion code for upcoming AWS blogpost on enrolling chembl and opentargets into a data lake on AWS  

![](https://quip-amazon.com/blob/HPG9AAwumxR/D5akZWKUWmfWEhA8u4loEA?a=U93UPcmkUsuoToxZr2QpWU5nosB1RwimIsIW5TtaJvEa)

## To install this in your own AWS account:

Your local machine needs to have the AWS CLI installed on your machine along with IAM permissions setup (through IAM role or .aws/credentials file). I like to use Cloud9 as my IDE as it comes with both of those already setup for me.  

Run the following commands  

```shell
git clone https://github.com/paulu-aws/chembl-opentargets-data-lake-example.git  
cd chembl-opentargets-data-lake-example  
./InstallCdkDependencies.sh  
./DeployChemblOpenTargetsEnv.sh
```

Wait for Chembl and OpenTargets to be ‘staged’ into the baseline stack.  

The ‘baseline stack’ in the CDK application spins up a VPC with an S3 bucket (for OpenTargets) and an RDS Postgres instance (for ChEMBL). It also spins up a little helper EC2 instance that stages those assets in their ‘raw’ form after downloading them from [OpenTargets.org](http://OpenTargets.org) and EMBL-EBI.  

Go to Systems Manager in the AWS console, and then the ‘Run Command’ section. You will see the currently running command documents.   

![](https://quip-amazon.com/blob/HPG9AAwumxR/x4lfduQeC3Ww-DyK8loIAg?a=6aMBuWAgnWaZ5pQaJndaM06ob734VpmiCI5xfguyPaca)

It takes about an hour for Chembl to build. If you get impatient and want to see the progress in real time, go to ‘Session Manager’ in the Systems Manager console, click the ‘Start session’ button, choose the ‘ChembDbImportInstance’ radio button, and click the ‘Start Session’ button.  

![](https://quip-amazon.com/blob/HPG9AAwumxR/Fj7sA3VuIuvdPOHl017Xcg?a=EYFlHaKY8weEGFezDR4ld3sEhBMWl88afFdDjJQ15H8a)

That will open a SSM session window. Run the following command to tail the log output.  

```tail -f /home/ssm-user/progressLog```

![](https://quip-amazon.com/blob/HPG9AAwumxR/rMcRhjzUcIGQVYeBFxup4Q?a=2NRscRrktD9kLK7rDqqD9bO3aXtTYttCeaEWLwDXVgIa)

## Enroll Chembl and OpenTargets into the data lake

Once the database has finished importing, go to Glue in the AWS console, and then the “Workflows” section  

![](https://quip-amazon.com/blob/HPG9AAwumxR/K0liqaLzOGNHdODU_fN_MA?a=GQQahtSxVQNvaU6AkEjATwCE0WJglr630LH3bZcngB0a)

Select the openTargetsDataLakeEnrollment workflow, and click ‘Actions’, then 'Run'  

![](https://quip-amazon.com/blob/HPG9AAwumxR/UV0-ZlwmK_KF9L9MfaUgfA?a=97k7vof4qlurzy3zSsmPVhomgCpRUJfREq8UCNZSzt4a)

Do the same for the chemblDataLakeEnrollmentWorkflow. Wait for the workflows to finish.  

Both workflows will run in parallel, but it will take the openTargetsDataLakeEnrollmentWorkflow ~170 minutes to complete while the ChEMBL enrollment will finish in about 30 minutes.   

## Query an Conquer!

Go to Athena in the AWS Console.  

If you haven't used Athena in your account before, you will need to define a storage location for your query results. Click on the ‘Settings’ tab in the top right and specify a bucket name where you would like Athena results stored and click save.  

![](https://quip-amazon.com/blob/HPG9AAwumxR/d9imQFzWnNdhWYDAo9Bt1A?a=8Q4UOXPqvG1fk3knDX9x2wr9Jeu9g8V2tPRYsnE3Vlga)

Now, click the ‘Databases’ dropdown:  

You will see 4 databases listed, you only want to use 2 of them:  

_**Use:**_

**chembl-25-dl**- This is the ‘dl’ or ‘data lake’ Chembl database. Always use tables in this database when running Chembl queries. Part of the chemblDataLakeEnrollment workflow converts the ‘source’ Chembl Postgres formats into a ‘data lake’ friendly parquet format optimized for Athena.   

**opentargets-1911-dl**- This is the ‘dl’ or ‘data lake’ OpenTargets database. Always use this table when running OpenTarget queries. Part of the chemblDataLakeEnrollment workflow converts the ‘source’ OpenTargets json and csv formats into a ‘data lake’ parquet format optimized for Athena.   

_**Dont use:**_

**chembl-25-src** - **This represents the ‘src’ or ‘source’ Chembl postgres database. By design, the source database is not directly queryable from Athena, so you will not use this database.   

**opentargets-1911-src** - This is the ‘src’ or ‘source’ table. When you query this table, you are directly querying the original chembl json and csv filesfrom OpenTargets. The performance may be slow as those formats are not optimized for querying with Athena.

  
## Permissions & Lake Formation

There are  [﻿two methods of security﻿](https://docs.aws.amazon.com/lake-formation/latest/dg/access-control-overview.html)  you can apply to your data lake. The default account configuration, which is likely what you are using at the moment, is essentially “open” Lake Formation permissions and “fine-grained” IAM polices. The DataSetStack construct implements a number of CDK-style grant*() methonds. The grantIamRead() method of the code grants a “fine-grained” IAM policy that gives users read access to just the tables in the data set you preform the grant on.



For example, in the bin/aws.ts file you can see an example of granting that “fine-grained” IAM read permission. Pretty easy! Here we are passing the role from the notebook, but you can import an existing IAM user, role, or group using the CDK.
```typescript
chemblStack.grantIamRead(analyticsStack.NotebookRole);  
openTargetsStack.grantIamRead(analyticsStack.NotebookRole);
```
The other method of security gives you more control. Specifically, the ability to control permissions at the database, table, and column level. This requires “fine-grained” Lake Formation permissions and “coarse” IAM permissions. The `grantDatabasePermissions()`, `grantTablePermissions()`, and `grantTableWithColumnPermissions()` setup both the fine-grained LakeFormation and coarse IAM permissions for you.

  

Again, another example in the `bin/aws.ts` file:

```typescript
const exampleUser = iam.User.fromUserName(coreDataLake,  'exampleGrantee',  'paulUnderwood'  );  

var exampleTableWithColumnsGrant:  DataLakeEnrollment.TableWithColumnPermissionGrant  =  {  
table:  "chembl_25_public_compound_structures",  
// Note that we are NOT including 'canonical_smiles'. That effectivley prevents this user from querying that column.  
columns:  ['molregno',  'molfile',  'standard_inchi',  'standard_inchi_key'],  
DatabasePermissions:  [],  
GrantableDatabasePermissions:  [],  
TableColumnPermissions:  [DataLakeEnrollment.TablePermission.Select],  
GrantableTableColumnPermissions:  []  
};  

chemblStack.grantTableWithColumnPermissions(exampleUser, exampleTableWithColumnsGrant);
````
  

The `GrantableDatabasePermissions`, `GrantableTableColumnPermissions`, and `GrantableTableColumnPermissions` give the supplied IAM principal permissions to grant permissions others. If you have a data-set steward, or someone who should have the authority to grant permissions to others, you cant "grant the permission to grant" using those properties.

  

To illustrate the the relationship between the fine-grained and coarse permissions, think of it as two doors. An IAM principal needs to have permission to walk through both doors to query the data lake. The DataLakeEnrollment construct handles granting both the fine and coarse permissions for you.

![image.png](https://api.quip-amazon.com/2/blob/HPG9AAwumxR/ACYxNvcfFhaRL15neEGWHA)

  

If you decide that you want the additional flexibility of Lake Formation permissions, you need to perform two manual actions before Lake Formation permissions will begin protecting your resources. Until you perform these two steps, you are only protecting your resources with the coarse IAM permission and the Lake Formation permissions wont apply.

  

1) Change the default permissions for newly created databases and tables

  

Visit the Lake Formation service page in the AWS console, and go to the “Settings” section on the left.

 
You need to  **UNCHECK** the two boxes and hit “Save”

![image.png](https://api.quip-amazon.com/2/blob/HPG9AAwumxR/luIf4C1WcTNeDeixOEbqsg)

2) You need to revoke all of the Lake Formation permissions that have been granted to `IAM_ALLOWED_PRINCIPALS`. If you have used Glue in the past or the ChEMBL or OpenTarget workflows have already completed you can see a bunch of them in the “Data Permissions” section in the Lake Formation console. By unchecking the boxes before, we are now stopping the default behavior where Lake Formation adds a `IAM_ALLOWED_PRINCIPALS` grant to any Glue Tables/Resources created.

  

Now that we have stopped that default-add `IAM_ALLOWED_PRINCIPALS` behavior, we need to back out any existing grants to `IAM_ALLOWED_PRINCIPALS`. As long as they remain, any IAM principal with coarse IAM permissions to the resource will still be able to query columns or tables they shouldn't have access to.

  

The `local.datalake.RemoveIamAllowedPrincipals.py` python script will save you the effort of manually revoking those permissions from IAM_ALLOWED_PRINCIPALS. Running the following command will issue the revokes for all IAM_ALLOWED_PRINCIPALS granted permissions.

```
python ./script/local.datalake.RemoveIamAllowedPrincipals.py
```

DONT RUN THIS COMMAND IF YOU HAVE PEOPLE ALREADY RELYING ON THE AWS GLUE CATALOG (via Athena for example). This will effectively remove their access until you grant them user/role/group specific Lake Formation permissions.

##Attributions

["ChEMBLdb"](https://chembl.gitbook.io/chembl-interface-documentation/downloads) by [European Bioinformatics Institute](https://www.ebi.ac.uk/about), [European Molecular Biology Laboratory](https://www.embl.org/) is licensed under [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0)

["Open Targets Platform: new developments and updates two years on"](https://academic.oup.com/nar/article/47/D1/D1056/5193331) by Denise Carvalho-Silva, Andrea Pierleoni, Miguel Pignatelli, ChuangKee Ong, Luca Fumis, Nikiforos Karamanis, Miguel Carmona, Adam Faulconbridge, Andrew Hercules, Elaine McAuley, Alfredo Miranda, Gareth Peat, Michaela Spitzer, Jeffrey Barrett, David G Hulcoop, Eliseo Papa, Gautier Koscielny, Ian Dunham, [Open Targets](https://www.opentargets.org/) is licensed under [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0)