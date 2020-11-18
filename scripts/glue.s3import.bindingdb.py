import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from pyspark.sql import SQLContext;
from awsglue.dynamicframe import DynamicFrame
from awsglue.context import GlueContext
from awsglue.job import Job
import boto3
from botocore.exceptions import ClientError
import json

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','DL_BUCKET', 'DL_PREFIX','DL_REGION', 'GLUE_SRC_DATABASE', 'SRC_SECRET_ARN', 'SRC_DB_HOSTNAME'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

dataLakeBucket = args["DL_BUCKET"];
dataLakePrefix = args["DL_PREFIX"];
aws_region = args["DL_REGION"];
glue_database = args["GLUE_SRC_DATABASE"];

secretName = args["SRC_SECRET_ARN"]
sourceDbHostName = args["SRC_DB_HOSTNAME"]

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
  

smClient = boto3.client(
    service_name='secretsmanager',
    region_name=aws_region
)
get_secret_value_response = smClient.get_secret_value(
    SecretId=secretName
)
sourceDbSecret = json.loads(get_secret_value_response['SecretString'])


sqlContext = SQLContext(sc) 


for table in tables:
  
  sourceTable = table;
  oracleTable = sourceTable.replace("orcl_bind_2000_05_","bind_2000_05.");
  destinationTable = sourceTable.replace("orcl_bind_2000_05_","")
  
  if "orcl_bind_2000_05" in sourceTable:
  
    glueContext.purge_s3_path("s3://"+dataLakeBucket + dataLakePrefix + destinationTable + "/", {"retentionPeriod": 0}, transformation_ctx="purge")    
    print("Purged - " + destinationTable)
    
    print("Populating Oracle Dataframe - " + destinationTable)
    dataframe_oracle = sqlContext.read.format("jdbc").option("url", "jdbc:oracle:thin:"+sourceDbSecret['username']+"/" +sourceDbSecret['password']+ "@" + sourceDbHostName +":1521/ORCL").option("driver", "oracle.jdbc.OracleDriver").option("dbtable", oracleTable).option("user ", sourceDbSecret['username']).option("password", sourceDbSecret['password']).load()
    
    #datasource = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = sourceTable, transformation_ctx = "datasource")   
    print("Converting Oracle Dataframe - " + destinationTable)
    dynamicframe_oracle = DynamicFrame.fromDF(dataframe_oracle, glueContext, 'oracleDfToDynamicFrame')
    
    print("DropNull - " + destinationTable)
    dropnullfields = DropNullFields.apply(frame = dynamicframe_oracle, transformation_ctx = "dropnullfields")
    
    try:
      print("Starting DataSink - " + destinationTable)
      datasink = glueContext.write_dynamic_frame.from_options(frame = dropnullfields, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket + dataLakePrefix + destinationTable}, format = target_format, transformation_ctx = "datasink")
      print("Finish DataSink - " + destinationTable)
    except Exception as ex:
      print("Unable to write" + destinationTable)
      print(ex)
    
job.commit()

