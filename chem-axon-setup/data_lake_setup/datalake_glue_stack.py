from aws_cdk import (
    core,
    aws_s3 as s3,
    aws_glue as glue
)

""" This module uses below parameters from config_dict passed to it :
config_dict = {
	'datalake_bucket_name': 'datalake-prod',
	'datalake_db_name': 'datalake_db'
}
"""
class DatalakeGlueStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, config_dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        """ Create the datalake database """
        createDatalakeDB = glue.Database(self, "createDatalakeDB",
                                         database_name=config_dict['datalake_db_name'])

        core.CfnOutput(self, "createDatalakeDBName", value=createDatalakeDB.database_name)


        """ Create Comp Reg Table """

        createDatalakeCompRegTable = glue.Table(self, "createDatalakeCompRegTable",
                columns=[
                    glue.Column(name="lot_compound_id", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="version_id", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="parent_id", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="smiles", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="parent_mw", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="salt_multiplicity", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="salt_name", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="formula_weight", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="parent_alias", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="stereochemistry", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="stereocomment", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="geometric_isomerism", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="parent_comment", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="parent_project", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="elnref", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="msmethod", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="msmass", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="provider", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="purity", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="puritymethod", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="nmrshifts", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="lotalias", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="lot_comment", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="lot_project", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="molfile", type=glue.Type(input_string="string", is_primitive=True)),
                    glue.Column(name="checksum", type=glue.Type(input_string="string", is_primitive=True))
                ],
                database=createDatalakeDB.from_database_arn(self, "GetDBArn",
                         database_arn=createDatalakeDB.database_arn),
                data_format=glue.DataFormat(
                          input_format=glue.InputFormat.PARQUET,
                           output_format=glue.OutputFormat.PARQUET,
                           serialization_library=glue.SerializationLibrary.PARQUET
                           ),
                table_name="tbl_compound_data",
                bucket=s3.Bucket.from_bucket_name(self, "getIBucket", bucket_name=config_dict['datalake_bucket_name']),
                compressed=True,
                description="This table contains data regarding compound registration coming from  RDS",
                partition_keys=[glue.Column(name="dt", type=glue.Type(input_string="string", is_primitive=True))],
                s3_prefix="compound_reg/compound_data/"
        )

        core.CfnOutput(self, "createDatalakeCompRegTableName", value=createDatalakeCompRegTable.table_name)