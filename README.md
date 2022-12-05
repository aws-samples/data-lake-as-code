# Lake House Ready Chemical and Genomics Databases from the Registry of Open Data on AWS

The AWS Registry of Open Data (RODA) hosts the following datasets in compressed/parquet/orc formats in a public S3 bucket which you are free to copy into your own bucket.

You can also query these datasets 'in place' using services like Athena, Redshift, Quicksight, and EMR to join with your own datasets.

The AWS CloudFormation templates below will create the neccesary AWS Glue database, tables, and schemas in your account's AWS Glue Data Catalog **in seconds**. With AWS Athena, this allows you to start querying the data with Athena directly out of the public S3 buckets, with zero servers or networking to setup. Other Lake House services like Redshift/EMR/QuickSight all directly integrate with the same AWS Glue Data Catalog meatastore so you can pick the right tool for the job.

![](https://github.com/aws-samples/data-lake-as-code/raw/roda/docs/HowLakeHouseReadyDatasetsWork.png)

Once deployed, you can use standard JDBC/ODBC to query these databases with your own notebooks, business inteligence tools, plotting software, HPC enviornment, or even your local development machine. 

## One time prerequisite 

If you have never used Amazon Athena in your account before, you need to [setup a default query location](https://docs.aws.amazon.com/athena/latest/ug/querying.html#query-results-specify-location-console). This should only take 2-3 minutes to do.

You only need to do this once. 

## Deploy this into my account

Click the links below for the data set you are interested in. Then click the "Create stack". Make sure you are in your preferred region. 


## Latest Versions:

### [Thousand Genomes DRAGEN ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FThousandGenomesDragenTemplate.template.json&stackName=Thousand-Genomes-DRAGEN) 

### [gnomAD ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FGNOMAD.template.json&stackName=gnomAD) 


### [ChEMBL 29 ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FChembl.29.RodaTemplate.json&stackName=Chembl29-RODA) 

### [Open Targets Latest ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FOpenTargets.latest.RodaTemplate.json&stackName=OpenTargets-Latest-RODA)

### [BindingDB ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FBindingDbRodaTemplate.json&stackName=BindingDB-RODA)

### [Genome Tissue Expresssion Database ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FGTEx.8.RodaTemplate.json&stackName=GTEx-8-RODA)

### [ClinVar ![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/quickcreate?templateUrl=https%3A%2F%2Faws-roda-hcls-datalake.s3.amazonaws.com%2FClinvarSummaryVariantTemplate.template.json&stackName=ClinVar-RODA)

It should take approximately 60 seconds for the stack to finish deploying.


---
**IMPORTANT NOTE!!! Extra Step for GTEx, and 1000 Genomes DRAGEN**

A handful of tables in these datasets either have LOTS of columns or partions. Expressing all of those columns in YAML would exceed the CloudFormation max template length! Once the template deploys, go the [AWS Glue Crawler Console](https://console.aws.amazon.com/glue/home?#catalog:tab=crawlers) check the box next to the `dataset_awsroda_crawler` and click 'Run crawler'. Once it finishes (1-3 minutes) you can query all tables in these datasets. 


---

## Query the data!

Go to the [Amazon Athena](https://console.aws.amazon.com/athena/home?force#query) console.

Select the database you just deployed in the "Database" drop down.

You should see the tables listed below. Expand the table to see the columns/schema for each table. You can also click on the vertical dots next to a table name and select 'Preview table' to get a quick feel for whats inside.

![](http://devspacepaul.s3.us-west-2.amazonaws.com/dlac/runquery.png)


## Want to know more?

### How this works
Take the time to visit the AWS Glue console. There, you will see the databases, tables, table definitions, etc. You will notice the locations for the tables are s3://aws-roda-hcls-datalake/database/etc. 

### More about the datasets:

These datasets were downloaded directly in thier original forms from the following locations. You should refer to the source documentation for the datasets below for more information about the data itself. We have not modified any datasets beyond converting them from thier orignal database dumps/json/csv/etc formats into a parquet representation for performance and cost efficency. 

[Thousand Genomes DRAGEN](https://aws.amazon.com/blogs/industries/dragen-reanalysis-of-the-1000-genomes-dataset-now-available-on-the-registry-of-open-data/)

[gnomAD](https://gnomad.broadinstitute.org/downloads)

[ChEMBL Source Data](https://chembl.gitbook.io/chembl-interface-documentation/downloads)

[Open Targets Source Data](https://www.targetvalidation.org/downloads/data)

[Binding DB Source Data](https://www.bindingdb.org/bind/chemsearch/marvin/SDFdownload.jsp?all_download=yes)

[GTEx Source Data](https://gtexportal.org/home/datasets)

[ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/)

### How were these datasets prepared?

Data sets in the AWS RODA HCLS Data Lake were created using the [Data Lake as Code Architecture (DLAC)](https://github.com/aws-samples/data-lake-as-code). The AWS RODA HCLS Data Lake tracks the [RODA branch](https://github.com/aws-samples/data-lake-as-code/tree/roda). The [DLAC mainline](https://github.com/aws-samples/data-lake-as-code/tree/mainline) branch is there to help you create your own data lake with your own private data sets using the DLAC framework.


