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
## @args: [database = "thousandgenomes_dragen_src", table_name = "var_nested", transformation_ctx = "DataSource0"]
## @return: DataSource0
## @inputs: []
DataSource0 = glueContext.create_dynamic_frame.from_catalog(database = "thousandgenomes_dragen_src", table_name = "var_nested", transformation_ctx = "DataSource0")
## @type: ApplyMapping
## @args: [mappings = [("variant_id", "string", "variant_id", "string"), ("pos", "int", "pos", "int"), ("ref", "string", "ref", "string"), ("alt", "string", "alt", "string"), ("samples", "array", "samples", "array"), ("chrom", "string", "chrom", "string")], transformation_ctx = "Transform0"]
## @return: Transform0
## @inputs: [frame = DataSource0]
Transform0 = ApplyMapping.apply(frame = DataSource0, mappings = [("variant_id", "string", "variant_id", "string"), ("pos", "int", "pos", "int"), ("ref", "string", "ref", "string"), ("alt", "string", "alt", "string"), ("samples", "array", "samples", "array"), ("chrom", "string", "chrom", "string")], transformation_ctx = "Transform0")
## @type: DataSink
## @args: [connection_type = "s3", format = "orc", connection_options = {"path": "s3://aws-roda-hcls-datalake/thousandgenomes_dragen/var_nested/", "compression": "snappy", "partitionKeys": []}, transformation_ctx = "DataSink2"]
## @return: DataSink2
## @inputs: [frame = Transform0]
DataSink2 = glueContext.write_dynamic_frame.from_options(frame = Transform0, connection_type = "s3", format = "orc", connection_options = {"path": "s3://aws-roda-hcls-datalake/thousandgenomes_dragen/var_nested/", "compression": "snappy", "partitionKeys": []}, transformation_ctx = "DataSink2")
## @type: DataSource
## @args: [database = "thousandgenomes_dragen_src", table_name = "var_partby_samples", transformation_ctx = "DataSource2"]
## @return: DataSource2
## @inputs: []
DataSource2 = glueContext.create_dynamic_frame.from_catalog(database = "thousandgenomes_dragen_src", table_name = "var_partby_samples", transformation_ctx = "DataSource2")
## @type: ApplyMapping
## @args: [mappings = [("variant_id", "string", "variant_id", "string"), ("chrom", "string", "chrom", "string"), ("pos", "int", "pos", "int"), ("alleles", "array", "alleles", "array"), ("rsid", "string", "rsid", "string"), ("qual", "double", "qual", "double"), ("filters", "array", "filters", "array"), ("`info.ac`", "array", "`info.ac`", "array"), ("`info.af`", "array", "`info.af`", "array"), ("`info.an`", "int", "`info.an`", "int"), ("`info.db`", "boolean", "`info.db`", "boolean"), ("`info.dp`", "int", "`info.dp`", "int"), ("`info.end`", "int", "`info.end`", "int"), ("`info.fs`", "double", "`info.fs`", "double"), ("`info.fractioninformativereads`", "double", "`info.fractioninformativereads`", "double"), ("`info.lod`", "double", "`info.lod`", "double"), ("`info.mq`", "double", "`info.mq`", "double"), ("`info.mqranksum`", "double", "`info.mqranksum`", "double"), ("`info.qd`", "double", "`info.qd`", "double"), ("`info.r2_5p_bias`", "double", "`info.r2_5p_bias`", "double"), ("`info.readposranksum`", "double", "`info.readposranksum`", "double"), ("`info.sor`", "double", "`info.sor`", "double"), ("ad", "array", "ad", "array"), ("af", "array", "af", "array"), ("dp", "int", "dp", "int"), ("fir2", "array", "fir2", "array"), ("f2r1", "array", "f2r1", "array"), ("gp", "array", "gp", "array"), ("gq", "int", "gq", "int"), ("`gt.alleles`", "array", "`gt.alleles`", "array"), ("`gt.phased`", "boolean", "`gt.phased`", "boolean"), ("mb", "array", "mb", "array"), ("pl", "array", "pl", "array"), ("pri", "array", "pri", "array"), ("ps", "int", "ps", "int"), ("sb", "array", "sb", "array"), ("sq", "double", "sq", "double"), ("sample_id", "string", "sample_id", "string"), ("ref", "string", "ref", "string"), ("alt", "string", "alt", "string"), ("partition_0", "string", "partition_0", "string")], transformation_ctx = "Transform2"]
## @return: Transform2
## @inputs: [frame = DataSource2]
Transform2 = ApplyMapping.apply(frame = DataSource2, mappings = [("variant_id", "string", "variant_id", "string"), ("chrom", "string", "chrom", "string"), ("pos", "int", "pos", "int"), ("alleles", "array", "alleles", "array"), ("rsid", "string", "rsid", "string"), ("qual", "double", "qual", "double"), ("filters", "array", "filters", "array"), ("`info.ac`", "array", "`info.ac`", "array"), ("`info.af`", "array", "`info.af`", "array"), ("`info.an`", "int", "`info.an`", "int"), ("`info.db`", "boolean", "`info.db`", "boolean"), ("`info.dp`", "int", "`info.dp`", "int"), ("`info.end`", "int", "`info.end`", "int"), ("`info.fs`", "double", "`info.fs`", "double"), ("`info.fractioninformativereads`", "double", "`info.fractioninformativereads`", "double"), ("`info.lod`", "double", "`info.lod`", "double"), ("`info.mq`", "double", "`info.mq`", "double"), ("`info.mqranksum`", "double", "`info.mqranksum`", "double"), ("`info.qd`", "double", "`info.qd`", "double"), ("`info.r2_5p_bias`", "double", "`info.r2_5p_bias`", "double"), ("`info.readposranksum`", "double", "`info.readposranksum`", "double"), ("`info.sor`", "double", "`info.sor`", "double"), ("ad", "array", "ad", "array"), ("af", "array", "af", "array"), ("dp", "int", "dp", "int"), ("fir2", "array", "fir2", "array"), ("f2r1", "array", "f2r1", "array"), ("gp", "array", "gp", "array"), ("gq", "int", "gq", "int"), ("`gt.alleles`", "array", "`gt.alleles`", "array"), ("`gt.phased`", "boolean", "`gt.phased`", "boolean"), ("mb", "array", "mb", "array"), ("pl", "array", "pl", "array"), ("pri", "array", "pri", "array"), ("ps", "int", "ps", "int"), ("sb", "array", "sb", "array"), ("sq", "double", "sq", "double"), ("sample_id", "string", "sample_id", "string"), ("ref", "string", "ref", "string"), ("alt", "string", "alt", "string"), ("partition_0", "string", "partition_0", "string")], transformation_ctx = "Transform2")
## @type: DataSink
## @args: [connection_type = "s3", format = "json", connection_options = {"path": "s3://aws-roda-hcls-datalake/thousandgenomes_dragen/var_partby_samples/", "partitionKeys": ["sample_id"]}, transformation_ctx = "DataSink1"]
## @return: DataSink1
## @inputs: [frame = Transform2]
DataSink1 = glueContext.write_dynamic_frame.from_options(frame = Transform2, connection_type = "s3", format = "json", connection_options = {"path": "s3://aws-roda-hcls-datalake/thousandgenomes_dragen/var_partby_samples/", "partitionKeys": ["sample_id"]}, transformation_ctx = "DataSink1")
## @type: DataSource
## @args: [database = "thousandgenomes_dragen_src", table_name = "var_partby_chrom", transformation_ctx = "DataSource1"]
## @return: DataSource1
## @inputs: []
DataSource1 = glueContext.create_dynamic_frame.from_catalog(database = "thousandgenomes_dragen_src", table_name = "var_partby_chrom", transformation_ctx = "DataSource1")
## @type: ApplyMapping
## @args: [mappings = [("variant_id", "string", "variant_id", "string"), ("pos", "int", "pos", "int"), ("ref", "string", "ref", "string"), ("alt", "string", "alt", "string"), ("sample_id", "string", "sample_id", "string"), ("alleles", "array", "alleles", "array"), ("rsid", "string", "rsid", "string"), ("qual", "double", "qual", "double"), ("filters", "array", "filters", "array"), ("`info.ac`", "array", "`info.ac`", "array"), ("`info.af`", "array", "`info.af`", "array"), ("`info.an`", "int", "`info.an`", "int"), ("`info.db`", "boolean", "`info.db`", "boolean"), ("`info.dp`", "int", "`info.dp`", "int"), ("`info.end`", "int", "`info.end`", "int"), ("`info.fs`", "double", "`info.fs`", "double"), ("`info.fractioninformativereads`", "double", "`info.fractioninformativereads`", "double"), ("`info.lod`", "double", "`info.lod`", "double"), ("`info.mq`", "double", "`info.mq`", "double"), ("`info.mqranksum`", "double", "`info.mqranksum`", "double"), ("`info.qd`", "double", "`info.qd`", "double"), ("`info.r2_5p_bias`", "double", "`info.r2_5p_bias`", "double"), ("`info.readposranksum`", "double", "`info.readposranksum`", "double"), ("`info.sor`", "double", "`info.sor`", "double"), ("ad", "array", "ad", "array"), ("af", "array", "af", "array"), ("dp", "int", "dp", "int"), ("fir2", "array", "fir2", "array"), ("f2r1", "array", "f2r1", "array"), ("gp", "array", "gp", "array"), ("gq", "int", "gq", "int"), ("`gt.alleles`", "array", "`gt.alleles`", "array"), ("`gt.phased`", "boolean", "`gt.phased`", "boolean"), ("mb", "array", "mb", "array"), ("pl", "array", "pl", "array"), ("pri", "array", "pri", "array"), ("ps", "int", "ps", "int"), ("sb", "array", "sb", "array"), ("sq", "double", "sq", "double"), ("partition_0", "string", "partition_0", "string"), ("chrom", "string", "chrom", "string")], transformation_ctx = "Transform1"]
## @return: Transform1
## @inputs: [frame = DataSource1]
Transform1 = ApplyMapping.apply(frame = DataSource1, mappings = [("variant_id", "string", "variant_id", "string"), ("pos", "int", "pos", "int"), ("ref", "string", "ref", "string"), ("alt", "string", "alt", "string"), ("sample_id", "string", "sample_id", "string"), ("alleles", "array", "alleles", "array"), ("rsid", "string", "rsid", "string"), ("qual", "double", "qual", "double"), ("filters", "array", "filters", "array"), ("`info.ac`", "array", "`info.ac`", "array"), ("`info.af`", "array", "`info.af`", "array"), ("`info.an`", "int", "`info.an`", "int"), ("`info.db`", "boolean", "`info.db`", "boolean"), ("`info.dp`", "int", "`info.dp`", "int"), ("`info.end`", "int", "`info.end`", "int"), ("`info.fs`", "double", "`info.fs`", "double"), ("`info.fractioninformativereads`", "double", "`info.fractioninformativereads`", "double"), ("`info.lod`", "double", "`info.lod`", "double"), ("`info.mq`", "double", "`info.mq`", "double"), ("`info.mqranksum`", "double", "`info.mqranksum`", "double"), ("`info.qd`", "double", "`info.qd`", "double"), ("`info.r2_5p_bias`", "double", "`info.r2_5p_bias`", "double"), ("`info.readposranksum`", "double", "`info.readposranksum`", "double"), ("`info.sor`", "double", "`info.sor`", "double"), ("ad", "array", "ad", "array"), ("af", "array", "af", "array"), ("dp", "int", "dp", "int"), ("fir2", "array", "fir2", "array"), ("f2r1", "array", "f2r1", "array"), ("gp", "array", "gp", "array"), ("gq", "int", "gq", "int"), ("`gt.alleles`", "array", "`gt.alleles`", "array"), ("`gt.phased`", "boolean", "`gt.phased`", "boolean"), ("mb", "array", "mb", "array"), ("pl", "array", "pl", "array"), ("pri", "array", "pri", "array"), ("ps", "int", "ps", "int"), ("sb", "array", "sb", "array"), ("sq", "double", "sq", "double"), ("partition_0", "string", "partition_0", "string"), ("chrom", "string", "chrom", "string")], transformation_ctx = "Transform1")
## @type: DataSink
## @args: [format_options = {"compression": "snappy"}, connection_type = "s3", format = "glueparquet", connection_options = {"path": "s3://aws-roda-hcls-datalake/thousandgenomes_dragen/var_partby_chrom/", "partitionKeys": ["sample_id"]}, transformation_ctx = "DataSink0"]
## @return: DataSink0
## @inputs: [frame = Transform1]
DataSink0 = glueContext.write_dynamic_frame.from_options(frame = Transform1, format_options = {"compression": "snappy"}, connection_type = "s3", format = "glueparquet", connection_options = {"path": "s3://aws-roda-hcls-datalake/thousandgenomes_dragen/var_partby_chrom/", "partitionKeys": ["sample_id"]}, transformation_ctx = "DataSink0")
job.commit()