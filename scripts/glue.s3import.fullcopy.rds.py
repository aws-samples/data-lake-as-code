import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
import boto3

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','DL_BUCKET', 'DL_PREFIX','DL_REGION', 'GLUE_SRC_DATABASE'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

dataLakeBucket = args["DL_BUCKET"];
dataLakePrefix = args["DL_PREFIX"];
aws_region = args["DL_REGION"];
glue_database = args["GLUE_SRC_DATABASE"];

target_format = "parquet"

client = boto3.client(service_name='glue', region_name=aws_region)


tables = []
keepPullingTables = True
nextToken = ''

while keepPullingTables:
  responseGetTables = client.get_tables(DatabaseName=glue_database, NextToken=nextToken)
  tableList = responseGetTables['TableList']
  for tableDict in tableList:
    tables.append(tableDict['Name'])
  
  if 'NextToken' in responseGetTables:
    nextToken = responseGetTables['NextToken']
  else:
    nextToken = ''
    
  keepPullingTables = True if nextToken != '' else False
  

for table in tables:
    
  datasource = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = table, transformation_ctx = "datasource")   
  dropnullfields = DropNullFields.apply(frame = datasource, transformation_ctx = "dropnullfields")
  
  try:
    datasink = glueContext.write_dynamic_frame.from_options(frame = dropnullfields, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket + dataLakePrefix + table}, format = target_format, transformation_ctx = "datasink")
  except:
    print("Unable to write" + table)
    
job.commit()


