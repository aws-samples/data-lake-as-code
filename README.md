# Data Lake as Code 

There are three primary branches for this repo. 

- [mainline]([https://github.com/aws-samples/data-lake-as-code/tree/mainline) - Allows you to use the Data Lake as Code architecture and constructs in your own enviornment. It excludes the RODA data sets and 'baseline' stack documented in the blog.
- [roda]([https://github.com/aws-samples/data-lake-as-code/tree/roda)- This branch tracks new AWS Registry of Open Data (RODA) data sets enrolled by the Data Lake as Code architecture. More on this coming soon...
- [blog]([https://github.com/aws-samples/data-lake-as-code/tree/roda) - This branch tracks the ['Data Lake as Code' blog post](https://aws.amazon.com/blogs/startups/a-data-lake-as-code-featuring-chembl-and-opentargets/)



## To install this in your own AWS account:

Your local machine needs to have the AWS CLI installed on your machine along with IAM permissions setup (through IAM role or .aws/credentials file). I like to use Cloud9 as my IDE as it comes with both of those already setup for me.  

Run the following commands  

```shell
git clone -b mainline https://github.com/aws-samples/data-lake-as-code  
cd data-lake-as-code 
./InstallCdkDependencies.sh  
./DeployOrUpdateDataLake.sh
```
This will install the CDK into your environment and create the core resources for you data lake. Should only take a few minutes. 

This includes the 'Data Lake' bucket where your enrolled datasets will reside in perpetuity along with some Lake Formation setup. 

## Enroll your own S3 data sets
There are three steps you need to complete to enroll your own data set.

### Organize your source S3 location
The Glue crawler expects your data to be organized into folders based on the table. In the example below, the Glue Crawler will create tables called "orders", "products", "customers", etc and automatically detect the table specific schemas based on the the data it samples in each folder. 

Its likely that many of your tables may just be one file. However, in the event your data set is broken up across multiple files, just keep those parts in the same shared table parent folder. See the customers/ example below. 

```
s3://source-bucket
│   ...
└───folder1
│   │   ...
│   └───SupplierData
│       │   orders/
|		|	|	ordersFile.csv
│       │   products/
|		|	|	productsDump.json
│       │   customers/
|		|	|	part000-customerDataFile.parquet
|		|	|	part001-customerDataFile.parquet
|		|	|	...
│       │   table3/
|		|	|	table3File.gz
│       │   ...
```
### Create a new CDK stack for you data set
Create a new file by copying the `lib/ExampleS3DataSet-stack.ts` file.
```
cp lib/ExampleS3DataSet-stack.ts lib/SupplierDataSet-stack.ts
```
Open up the new `SupplierDataSet-stack.ts` file.

Update the `ExampleS3DataSet` and `exampledataset_v1` lines with a more meaningful name to your data set:
```
export class ExampleS3DataSet extends DataSetStack{
...
const dataSetName = "exampledataset_v1"
```
### Create a new Glue script

Create a new Glue script for your data set in the scripts folder. If you are just looking to do straight column for column enrollment, you can just copy the `glue.s3import.exampledataset.s3.py'





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

![](https://docs.aws.amazon.com/lake-formation/latest/dg/images/permissions_doors.png)

  

If you decide that you want the additional flexibility of Lake Formation permissions, you need to perform two manual actions before Lake Formation permissions will begin protecting your resources. Until you perform these two steps, you are only protecting your resources with the coarse IAM permission and the Lake Formation permissions wont apply.

  

1) Change the default permissions for newly created databases and tables

  

Visit the Lake Formation service page in the AWS console, and go to the “Settings” section on the left.

 
You need to  **UNCHECK** the two boxes and hit “Save”

![](https://devspacepaul.s3.us-west-2.amazonaws.com/DataCatalogSettings.png)

2) You need to revoke all of the Lake Formation permissions that have been granted to `IAM_ALLOWED_PRINCIPALS`. If you have used Glue in the past or the ChEMBL or OpenTarget workflows have already completed you can see a bunch of them in the “Data Permissions” section in the Lake Formation console. By unchecking the boxes before, we are now stopping the default behavior where Lake Formation adds a `IAM_ALLOWED_PRINCIPALS` grant to any Glue Tables/Resources created.

  

Now that we have stopped that default-add `IAM_ALLOWED_PRINCIPALS` behavior, we need to back out any existing grants to `IAM_ALLOWED_PRINCIPALS`. As long as they remain, any IAM principal with coarse IAM permissions to the resource will still be able to query columns or tables they shouldn't have access to.

  

The `local.datalake.RemoveIamAllowedPrincipals.py` python script will save you the effort of manually revoking those permissions from IAM_ALLOWED_PRINCIPALS. Running the following command will issue the revokes for all IAM_ALLOWED_PRINCIPALS granted permissions.

```
python ./script/local.datalake.RemoveIamAllowedPrincipals.py
```

DONT RUN THIS COMMAND IF YOU HAVE PEOPLE ALREADY RELYING ON THE AWS GLUE CATALOG (via Athena for example). This will effectively remove their access until you grant them user/role/group specific Lake Formation permissions.
