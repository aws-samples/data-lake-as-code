import cx_Oracle
import os
import pandas as pd
import boto3
import base64
from botocore.exceptions import ClientError
import ast
import numpy as np
import hashlib
import sys
import logging
from datetime import datetime
import socket

"""
Create a logging function and initiate it.
"""
format_string = "%(asctime)s %(name)s [%(levelname)s] %(message)s"
logger = logging.getLogger('compound-registration-process')
handler = logging.StreamHandler()
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter(format_string)
handler.setFormatter(formatter)
logger.addHandler(handler)

def get_secret(secret_name, region_name):

    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            # You provided a parameter value that is not valid for the current state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
    else:
        # Decrypts secret using the associated KMS CMK.
        # Depending on whether the secret is a string or binary, one of these fields will be populated.
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
        else:
            decoded_binary_secret = base64.b64decode(get_secret_value_response['SecretBinary'])

    return secret

def initialize_oracle_conn():
    """
    This function will return a connection object to be used for querying.
    :return: oracle connection object
    """
    # Get details from Secrets Manager
    get_oracle_connection_details = ast.literal_eval(get_secret(secret_name, region_name))

    # Parse secret manager keys into individual parameters for oracle connection
    oracle_host = get_oracle_connection_details['db_host']
    oracle_port = get_oracle_connection_details['db_port']
    oracle_service_name = get_oracle_connection_details['db_service_name']
    oracle_user = get_oracle_connection_details['db_username']
    oracle_password = get_oracle_connection_details['db_password']

    # Create DSN and connection object
    dsn_tns = cx_Oracle.makedsn(oracle_host, oracle_port, service_name=oracle_service_name)
    conn = cx_Oracle.connect(user=oracle_user, password=oracle_password, dsn=dsn_tns)

    return conn

def create_already_loaded_data_df():
    """
    This function will parse the existing bucket and load all data one by one into a single dataframe
    :return: Returns a dataframe
    """
    # Read studies to be ignored
    s3_bucket = s3.Bucket(compreg_bucket)
    list_of_parquet_file_keys = []

    for file in s3_bucket.objects.all():
        if ".parquet" in file.key:
            list_of_parquet_file_keys.append(file.key)

    if len(list_of_parquet_file_keys) > 0:
        df = pd.DataFrame()
        for file in list_of_parquet_file_keys:
            temp_df = pd.read_parquet("s3://" + compreg_bucket + "/" + file)
            df = pd.concat([df, temp_df])

        df = df.drop_duplicates()

    else:
        df = pd.DataFrame(columns=['CHECKSUM'])

    return df

def get_latest_data_from_oracle():
    """
    This function will invoke oracle connection and run query and bring the data into a pandas dataframe.
    :return: Dataframe with latest oracle data.
    """
    oracle_connection = initialize_oracle_conn()

    query_string = "SELECT a.lot_compound_id, \
                           a.version_id, \
                           a.parent_id, \
                           a.structure_id, \
                           a.smiles, \
                           a.parent_mw, \
                           a.salt_multiplicity, \
                           a.salt_name, \
                           a.formula_weight, \
                           a.parent_alias, \
                           a.stereochemistry, \
                           a.stereocomment, \
                           a.geometric_isomerism, \
                           a.parent_comment, \
                           a.parent_project, \
                           a.elnRef, \
                           a.msmethod, \
                           a.msmass, \
                           a.provider, \
                           a.purity, \
                           a.puritymethod, \
                           a.nmrshifts, \
                           a.lotalias, \
                           a.lot_comment, \
                           a.lot_project, \
                           b.molfile \
                    FROM (SELECT il.id_value AS lot_compound_id, \
                       iv.ID_VALUE AS version_id, \
                       ip.ID_VALUE AS parent_id, \
                       max(s.cd_id) AS structure_id, \
                       max(s.CD_SMILES) AS smiles, \
                       max(s.CD_MOLWEIGHT) AS parent_mw, \
                       vss.MULTIPLICITY AS salt_multiplicity, \
                       ss.NAME AS salt_name, \
                       max((s.cd_molweight + (vss.MULTIPLICITY*st.CD_MOLWEIGHT))) AS formula_weight, \
                       max(decode(adp.AD_NAME,'parentalias', adp.AD_VALUE)) AS parent_alias, \
                       max(decode(adp.AD_NAME,'Stereochemistry', adp.AD_VALUE)) AS stereochemistry, \
                       max(decode(adp.AD_NAME,'stereocomment', adp.AD_VALUE)) AS stereocomment, \
                       max(decode(adp.AD_NAME,'Geometric isomerism', adp.AD_VALUE)) AS geometric_isomerism, \
                       max(decode(adp.AD_NAME,'comment', adp.AD_VALUE)) AS parent_comment, \
                       max(decode(adp.AD_NAME,'projects', adp.AD_VALUE)) AS parent_project, \
                       max(decode(adl.AD_NAME,'elnRef',adl.AD_VALUE)) AS elnRef, \
                       max(decode(adl.AD_NAME,'msmethod',adl.AD_VALUE)) AS msmethod, \
                       max(decode(adl.AD_NAME,'msmass',adl.AD_VALUE)) AS msmass, \
                       max(decode(adl.AD_NAME,'provider',adl.AD_VALUE)) AS provider, \
                       max(decode(adl.AD_NAME,'purity',adl.AD_VALUE)) AS purity, \
                       max(decode(adl.AD_NAME,'puritymethod',adl.AD_VALUE)) AS puritymethod, \
                       max(decode(adl.AD_NAME,'nmrshifts',adl.AD_VALUE)) AS nmrshifts, \
                       max(decode(adl.AD_NAME,'lotalias',adl.AD_VALUE)) AS lotalias, \
                       max(decode(adl.AD_NAME,'comment',adl.AD_VALUE)) AS lot_comment, \
                       max(decode(adl.AD_NAME,'projects',adl.AD_VALUE)) AS lot_project \
                    FROM IDENTIFIER il \
                    JOIN COMPOUND cl ON il.COMPOUND_ID = cl.COMPOUND_ID \
                    JOIN COMPOUND cve ON cl.ANCESTOR = cve.COMPOUND_ID \
                    JOIN COMPOUND cp ON cve.ANCESTOR = cp.COMPOUND_ID \
                    JOIN IDENTIFIER ip ON ip.COMPOUND_ID = cp.COMPOUND_ID \
                    JOIN IDENTIFIER iv ON cve.COMPOUND_ID = iv.COMPOUND_ID \
                    JOIN molecule m ON cp.COMPOUND_ID = m.COMPOUND_ID \
                    JOIN molecule mv ON cve.COMPOUND_ID = mv.COMPOUND_ID \
                    JOIN \"STRUCTURE\" s ON m.STRUCTURE_ID = s.cd_id \
                    LEFT OUTER JOIN VERSION_SALTSOLVATE vss ON vss.VERSION_ID = cve.COMPOUND_ID \
                    LEFT OUTER JOIN SALTSOLVATE ss ON vss.SALTSOLVATE_ID = ss.SALTSOLVATE_ID \
                    LEFT OUTER JOIN STRUCTURE st ON ss.STRUCTURE_ID = st.cd_id \
                    LEFT OUTER JOIN ADDITIONAL_DATA adp ON adp.COMPOUND_ID = cp.COMPOUND_ID \
                    LEFT OUTER JOIN ADDITIONAL_DATA adl ON adl.COMPOUND_ID = cl.COMPOUND_ID \
                    WHERE il.TYPE_ID = 3 \
                    GROUP BY il.id_value, iv.id_value, ip.id_value, vss.MULTIPLICITY, ss.NAME) a,  \
                            (SELECT s.cd_id, s.cd_structure AS molfile FROM STRUCTURE s) b  \
                    WHERE a.structure_id = b.cd_id \
                    order by a.lot_compound_id"

    df = pd.read_sql_query(query_string, con=oracle_connection)
    df = df.replace(np.nan, '', regex=True)

    # Create Checksum/MD5Sum value for getting duplicates.
    df['CHECKSUM'] = df.astype(str).apply(''.join, axis=1)
    df['CHECKSUM'] = df.apply(lambda x: hashlib.md5(x.CHECKSUM.encode('utf-8')).hexdigest(), axis=1)

    df = df.astype(str)
    oracle_connection.close()

    return df

def update_new_partitions(tablename):
    """
    This function is used to run msck repair table on athena table passed as input.
    :return: It returns the response from athena on query execution.
    """
    athena_client = boto3.client('athena', region_name=region_name)
    athena_location = "s3://" + compreg_bucket + "/athena/"
    athena_db_name = 'comp_reg_data_db'
    response = athena_client.start_query_execution(QueryString='MSCK REPAIR TABLE ' + athena_db_name + '.' + tablename,
                                            QueryExecutionContext={'Database': athena_db_name},
                                            ResultConfiguration={ 'OutputLocation': athena_location }
                                            )

    return(response)

"""
MAIN PROGRAM START
"""
if __name__ == "__main__":

    """ 
    Initializing Variables 
    """
    todays_date = datetime.today().strftime('%Y-%m-%d')
    region_name = sys.argv[1]
    secret_name = os.environ.get('COMPREG_ORACLE_SECRET_NAME')
    compreg_bucket = os.environ.get('COMPREG_BUCKET')

    # Updating /etc/host file to avoid error : cx_Oracle.DatabaseError: ORA-24454: client host name is not set
    hostname = socket.gethostname()
    command_exec = "echo \"127.0.0.1   localhost " + hostname + "\" > /etc/hosts"
    os.system(command_exec)
    logger.info("The /etc/hosts file is modified for oracle connection.")
    
    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager', region_name=region_name )

    # Create s3 resource for putting json files
    s3 = boto3.resource(service_name='s3', region_name=region_name )

    # Get the historic data already loaded into pandas DF
    history_df = create_already_loaded_data_df()
    logger.info("history_df created successfully from : s3://" + compreg_bucket + "/compound_reg/compound_data/ and has : " + \
                str(len(history_df)) + " records.")

    # Get latest oracle data into pandas DF
    latest_df = get_latest_data_from_oracle()
    logger.info("latest_df created successfully from Oracle database and has : " + str(len(latest_df)) + " records.")

    # Get only changed records
    new_df = latest_df[(~latest_df.CHECKSUM.isin(history_df.CHECKSUM))]
    logger.info("new_df with new/updated records created successfully and has : " + str(len(new_df)) + " records.")

    # Write only new/changed records to S3
    if len(new_df) > 0:
        new_df.to_parquet("s3://" + compreg_bucket + "/compound_reg/compound_data/dt=" + str(todays_date) + "/data.parquet",
                          compression='GZIP', index=False)
        logger.info("New/Updated records successfully written to s3://" + compreg_bucket + "/compound_reg/compound_data/dt=" +
                    str(todays_date) + "/data.parquet")
    else:
        logger.info("No New/Updated records available to be written to s3")

    """ Update the partitions on the athena tables """
    compound_data_athena = update_new_partitions('compound_data')
    logger.info("Partitions added or removed for Athena Table successfully.")

    logger.info('The script will end now.')