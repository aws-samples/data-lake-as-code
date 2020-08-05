import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
import boto3


target_format = "parquet"

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','DL_BUCKET', 'DL_PREFIX', 'DL_REGION', 'GLUE_SRC_DATABASE'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session

spark.sqlContext.setConf("spark.sql.parquet.writeLegacyFormat", "true")

job = Job(glueContext)

dataLakeBucket = args["DL_BUCKET"];
dataLakePrefix = args["DL_PREFIX"];
aws_region = args["DL_REGION"];
glue_database = args["GLUE_SRC_DATABASE"];


job.init(args['JOB_NAME'], args)

client = boto3.client(service_name='glue', region_name=aws_region)
responseGetTables = client.get_tables(DatabaseName=glue_database)

tableList = responseGetTables['TableList']
tables = []
for tableDict in tableList:
  tables.append(tableDict['Name'])
  
  
for table in tables:
  datasource = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = table)   
  dropnullfields = DropNullFields.apply(frame = datasource, transformation_ctx = "dropnullfields1")
  try:
    datasink = glueContext.write_dynamic_frame.from_options(frame = dropnullfields, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket + dataLakePrefix + table}, format = target_format)
  except:
    print("Unable to write" + table)
    
job.commit()