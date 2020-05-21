import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

## @params: [JOB_NAME]
args = getResolvedOptions(sys.argv, ['JOB_NAME','DL_BUCKET', 'DL_PREFIX', 'GLUE_SRC_DATABASE'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)


dataLakeBucket = args["DL_BUCKET"];
dataLakePrefix = args["DL_PREFIX"];
glue_database = args["GLUE_SRC_DATABASE"];

## Association Data

datasource0 = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = "19_11_association_data", transformation_ctx = "datasource0")

applymapping1 = ApplyMapping.apply(frame = datasource0, mappings = [("target", "struct", "target", "struct"), ("association_score", "struct", "association_score", "struct"), ("disease", "struct", "disease", "struct"), ("is_direct", "boolean", "is_direct", "boolean"), ("evidence_count", "struct", "evidence_count", "struct"), ("id", "string", "id", "string")], transformation_ctx = "applymapping1")

resolvechoice2 = ResolveChoice.apply(frame = applymapping1, choice = "make_struct", transformation_ctx = "resolvechoice2")

dropnullfields3 = DropNullFields.apply(frame = resolvechoice2, transformation_ctx = "dropnullfields3")

datasink4 = glueContext.write_dynamic_frame.from_options(frame = dropnullfields3, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket+dataLakePrefix+"association_data/"}, format = "parquet", transformation_ctx = "datasink4")


## diseaseList

datasource0diseaseList = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = "19_11_disease_list", transformation_ctx = "datasource0diseaseList")

applymapping1diseaseList = ApplyMapping.apply(frame = datasource0diseaseList, mappings = [("col0", "string", "col0", "string"), ("col1", "string", "col1", "string"), ("col2", "long", "col2", "long")], transformation_ctx = "applymapping1diseaseList")

resolvechoice2diseaseList = ResolveChoice.apply(frame = applymapping1diseaseList, choice = "make_struct", transformation_ctx = "resolvechoice2diseaseList")

dropnullfields3diseaseList = DropNullFields.apply(frame = resolvechoice2diseaseList, transformation_ctx = "dropnullfields3diseaseList")

datasink4diseaseList = glueContext.write_dynamic_frame.from_options(frame = dropnullfields3diseaseList, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket+dataLakePrefix+"disease_list/"}, format = "parquet", transformation_ctx = "datasink4diseaseList")



## evidenceData


datasource0evidenceData = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = "19_11_evidence_data", transformation_ctx = "datasource0evidenceData")

applymapping1evidenceData = ApplyMapping.apply(frame = datasource0evidenceData, mappings = [("target", "struct", "target", "struct"), ("validated_against_schema_version", "string", "validated_against_schema_version", "string"), ("sourceid", "string", "sourceid", "string"), ("disease", "struct", "disease", "struct"), ("unique_association_fields", "struct", "unique_association_fields", "struct"), ("evidence", "struct", "evidence", "struct"), ("access_level", "string", "access_level", "string"), ("drug", "struct", "drug", "struct"), ("scores", "struct", "scores", "struct"), ("type", "string", "type", "string"), ("id", "string", "id", "string"), ("literature", "struct", "literature", "struct")], transformation_ctx = "applymapping1evidenceData")

resolvechoice2evidenceData = ResolveChoice.apply(frame = applymapping1evidenceData, choice = "make_struct", transformation_ctx = "resolvechoice2evidenceData")

dropnullfields3evidenceData = DropNullFields.apply(frame = resolvechoice2evidenceData, transformation_ctx = "dropnullfields3evidenceData")

datasink4evidenceData = glueContext.write_dynamic_frame.from_options(frame = dropnullfields3evidenceData, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket+dataLakePrefix+"evidence_data/"}, format = "parquet", transformation_ctx = "datasink4evidenceData")



## targetList

datasource0targetList = glueContext.create_dynamic_frame.from_catalog(database = glue_database, table_name = "19_11_target_list", transformation_ctx = "datasource0targetList")

applymapping1targetList = ApplyMapping.apply(frame = datasource0targetList, mappings = [("col0", "string", "col0", "string"), ("col1", "string", "col1", "string"), ("col2", "string", "col2", "string"), ("col3", "long", "col3", "long")], transformation_ctx = "applymapping1targetList")

resolvechoice2targetList = ResolveChoice.apply(frame = applymapping1targetList, choice = "make_struct", transformation_ctx = "resolvechoice2targetList")

dropnullfields3targetList = DropNullFields.apply(frame = resolvechoice2targetList, transformation_ctx = "dropnullfields3targetList")

datasink4 = glueContext.write_dynamic_frame.from_options(frame = dropnullfields3targetList, connection_type = "s3", connection_options = {"path": "s3://"+dataLakeBucket+dataLakePrefix+"target_list/"}, format = "parquet", transformation_ctx = "datasink4targetList")
job.commit()