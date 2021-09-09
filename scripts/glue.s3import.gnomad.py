import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)
## @type: DataSource
## @args: [database = "gnomad_src", table_name = "chrm", transformation_ctx = "DataSource0"]
## @return: DataSource0
## @inputs: []
DataSource0 = glueContext.create_dynamic_frame.from_catalog(database = "gnomad_src", table_name = "chrm", transformation_ctx = "DataSource0")
## @type: DataSink
## @args: [format_options = {"compression": "snappy"}, connection_type = "s3", format = "glueparquet", connection_options = {"path": "s3://aws-roda-hcls-datalake/gnomad/chrm/", "partitionKeys": []}, transformation_ctx = "DataSink0"]
## @return: DataSink0
## @inputs: [frame = DataSource0]
DataSink0 = glueContext.write_dynamic_frame.from_options(frame = DataSource0, format_options = {"compression": "snappy"}, connection_type = "s3", format = "glueparquet", connection_options = {"path": "s3://aws-roda-hcls-datalake/gnomad/chrm/", "partitionKeys": []}, transformation_ctx = "DataSink0")
## @type: DataSource
## @args: [database = "gnomad_src", table_name = "sites", transformation_ctx = "DataSource1"]
## @return: DataSource1
## @inputs: []
DataSource1 = glueContext.create_dynamic_frame.from_catalog(database = "gnomad_src", table_name = "sites", transformation_ctx = "DataSource1")
## @type: DataSink
## @args: [format_options = {"compression": "snappy"}, connection_type = "s3", format = "glueparquet", connection_options = {"path": "s3://aws-roda-hcls-datalake/gnomad/sites/", "partitionKeys": ["partition_0"]}, transformation_ctx = "DataSink1"]
## @return: DataSink1
## @inputs: [frame = DataSource1]
DataSink1 = glueContext.write_dynamic_frame.from_options(frame = DataSource1, format_options = {"compression": "snappy"}, connection_type = "s3", format = "glueparquet", connection_options = {"path": "s3://aws-roda-hcls-datalake/gnomad/sites/", "partitionKeys": ["partition_0"]}, transformation_ctx = "DataSink1")
job.commit()