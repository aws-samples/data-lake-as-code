# Installing Lakehouse Ready Datasets from the  Registry of Open Data on AWS

The AWS Registry of Open Data (RODA) hosts the following ML datasets in their original forms along with compressed/parquet/orc formats in a public S3 bucket which you are free to copy into your own bucket.

You can also query these datasets 'in place' right out of the public bucket using services like Athena, Redshift, Quicksight, and EMR to join with your own datasets by deploying the accompanying CloudFormation template to create the Glue Data Catalog entries for you.
 
## YouTube 8 Million

It's best to read up on the dataset itself on the [YT8M website](https://research.google.com/youtube8m/index.html). 

We provide the data in two forms. 

- **Option 1)** The original .tfrecord format provided by Google Research.
- **Option 2)** Parquet conversions of those tfrecords into a format that lets you query the data in place directy out of the S3 bucket.

### Option 1)

Your typical `s3 sync` or `s3 cp` commands will download the files for you. The folder structure is identical to how the data is distributed by Google Research.

```
s3://aws-roda-ml-datalake/yt8m/
    └───2/
        └───frame/
            └───test/*.tfrecord
            └───train/*.tfrecord
            └───validate/*.tfrecord
            
        └───video/
            └───test/*.tfrecord
            └───train/*.tfrecord
            └───validate/*.tfrecord
    └───3/ 
        └───frame/
            └───test/*.tfrecord
            └───validate/*.tfrecord
    └───vocabulary.csv

```

### Option 2)

Deploy the YT8M CloudFormation Template by clicking "Launch stack" below. Only takes about 60 seconds.

[![](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2#/stacks/quickcreate?templateUrl=https://aws-roda-ml-datalake.s3.us-west-2.amazonaws.com/YT8MRodaTemplate.RodaTemplate.json&stackName=YT8M-RODA) 

If you have never used Amazon Athena in your account before, you need to [setup a default query location](https://docs.aws.amazon.com/athena/latest/ug/querying.html#query-results-specify-location-console). This should only take 2-3 minutes to do. You only need to do this once. 

Go to the [Amazon Athena](https://console.aws.amazon.com/athena/home?force#query) console.

Select the YT8M you just deployed in the "Database" drop down.

You should see the tables listed below. Expand the table to see the columns/schema for each table. You can also click on the vertical dots next to a table name and select 'Preview table' to get a quick feel for whats inside.

Now that your Glue tables have been created, you use SageMaker, Redshift, Quicksight, etc to begin training or joining with your own data. 


## How this works


Data sets in the AWS RODA ML Data Lake were created using the [Data Lake as Code Architecture (DLAC)](https://github.com/aws-samples/data-lake-as-code). The AWS RODA ML Data Lake tracks the [RODA-ML branch](https://github.com/aws-samples/data-lake-as-code/tree/roda-ml). The [DLAC mainline](https://github.com/aws-samples/data-lake-as-code/tree/mainline) branch is there to help you create your own data lake with your own private data sets using the DLAC framework.

The AWS CloudFormation templates create the necessary AWS Glue database, tables, and schemas in your account's AWS Glue Data Catalog in seconds. With AWS Athena, this allows you to start querying the data with Athena directly out of the public S3 buckets, with zero servers or networking to setup. AWS Machine Learning services like SageMaker and and Lake House services like Redshift/EMR/QuickSight all directly integrate with the same AWS Glue Data Catalog meatastore so you can pick the right tool for the job.

![](https://raw.githubusercontent.com/aws-samples/data-lake-as-code/roda/docs/HowLakeHouseReadyDatasetsWork.png)

You can also use standard JDBC/ODBC to query these databases with your own notebooks, R studio environments, business intelligence tools, plotting software, Redshift or EMR clusters, or even your local development machine. 



Take the time to visit the AWS Glue console. There, you will see the databases, tables, table definitions, etc. You will notice the locations for the tables are s3://aws-roda-hcls-datalake/database/etc. 

## More about the datasets:

These datasets were downloaded directly in their original forms from the following locations. You should refer to the source documentation for the datasets below for more information about the data itself. We have not modified any datasets beyond converting them from their original database dumps/json/csv/etc formats into a parquet representation for performance and cost efficiency. 

[YT8M from Google Research](https://research.google.com/youtube8m/index.html)


