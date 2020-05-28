<h1 id='HPG9CA7YL2o'>ChemAxon Compound Registration DB to AWS Data Lake</h1>

The folder/repo holds the codebase for creating AWS Infrastructure and ETL job for loading data from existing Compound
Registration Database to S3 in a scheduled way.<br/>

### Pre-requisites

- AWS RDS Instance which holds Compound Registration Data.

- AWS Details like VPC, Subnet, AZ's, RDS Connection Details to be filled in configs/deploy_config.env file for each env.

- Python and CDK installed.

### Steps to be executed

- Download the codebase locally.
- Ensure the AWS profiles are set for use.
- Fill the details in configs/deploy_config.env
- Start the deployment by running :

  ```bash
  # env is the same variable used in configs/deploy_config.env in lower case.
  # aws_profile is the profile to be used. If no profile is manually set, provide default.
  sh DeployChemAxonCompRegEnv.sh <env> <aws_profile>
  ```

### What will be setup?

As soon as the deploy.sh is executed, it will gather the variables from configs/deploy_config.env as per Env passed and make those variables available on the command line. It will then start creating below objects as per order mentioned.

- AWS Batch Infrastructure : It will create a Compute Environment and Job Queue along with the EC2 Security group and IAM roles and policies required.

- AWS ECR and Batch Job : It will create ECR Repository and AWS Batch Job  Definition.

- Docker Image : It will create a Docker Image from compound_reg_pipeline folder as per Dockerfile. It is currently considering the Comp-Reg RDS to be Oracle and hence installing dependencies for the ETL code. The actual ETL job is comp_reg_data_load.py which will be invoked as per the required/mentioned frequency.

  This image is then pushed to ECR Repository.

- AWS Secret Manager : A secret with Comp Reg RDS Credentials is created. This secret key is then used in the ETL.

- AWS S3 Bucket and Lambda : A s3 bucket is created which will be used for data loading. Along with it a Lambda Function which will be used to trigger the ETL is also created. This lambda function details could be found from chem-axon-setup/lambdas/trigger_compound_reg_pipeline.py

  Currently it is using S3 event trigger but that can be changed to any other trigger of choice as well.

- AWS S3 Bucket and Lambda : A s3 bucket is created which will be used for data loading. Along with it a Lambda Function which will be used to trigger the ETL is also created. This lambda function details could be found from chem-axon-setup/lambdas/trigger_compound_reg_pipeline.py 

  Currently it is using S3 event trigger but that can be changed to any other trigger of choice as well.

- AWS Glue : A glue database and table on top of the S3 bucket data is created for querying through Athena.


### ETL Process

The script chem-axon-setup/compound_reg_pipeline/comp_reg_data_load.py when triggered follows the below steps :

- Queries the latest data from Comp Reg DB and creates a pandas dataframe.
- Brings all the already loaded data from S3 and creates another pandas dataframe.
- Compares the 2 DF's using hash's and creates a new DF with only new or updated records.
- Loads this new DF into a new S3 partition with date in parquet format.
  (The partition can be user specific and depends on the frequency of execution.)
- If no new data is detected, it will just exit.
- The logs are available in cloudwatch and can be found in AWS Batch -> Jobs dashboard -> Specific Job ID Details.
