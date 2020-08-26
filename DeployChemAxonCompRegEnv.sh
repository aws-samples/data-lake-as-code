#!/bin/bash
set -e -x

# Browse through the required directory
cd chem-axon-setup

# Read Arguments
export EnvironVarLower=$1
export AwsProfile=$2

# Install packages
pip3 install -r requirements.txt

## Initialise Variables
source configs/deploy_config.env ${EnvironVarLower}

## Touch credentials file as cdk module has a dependency on it.
## Its empty in this case and is only required for cdk module to work.
touch ~/.aws/credentials

# Function to build compound reg docker image and push it to AWS ECR Repo
build_and_push_comp_reg_image(){

    # Build the docker image locally
    docker build --rm -t ${AccountId}.dkr.ecr.${AwsRegion}.amazonaws.com/${WorkflowEcrRepository}:${WorkflowCompRegImage} \
      --build-arg="PYTHON_VERSION=3.7" \
      --build-arg="UBUNTU_VERSION=18.04" \
      --build-arg="ORACLE_VERSION=12.2.0.1.0" \
      --build-arg="ORACLE_ZIP_INTERNAL_FOLDER=instantclient_12_2" compound_reg_pipeline/

    # Push the image on AWS ECR
    docker push ${AccountId}.dkr.ecr.${AwsRegion}.amazonaws.com/${WorkflowEcrRepository}:${WorkflowCompRegImage}

}

# Check for profile and if not passed, use default
if [[ ${AwsProfile} == '' ]]
then
    #Get Account ID
    aws configure set region ${AwsRegion}
    export AccountId=$(aws sts get-caller-identity --output text --query 'Account')

    #ECR Login for pushing Docker Image
    $(aws ecr get-login --no-include-email --region ${AwsRegion})

    cdk deploy gfb-datalake-batch-stack --require-approval never
    cdk deploy gfb-datalake-batch-job-stack --require-approval never
    build_and_push_comp_reg_image
    cdk deploy gfb-datalake-secret-manager-stack --require-approval never
    cdk deploy gfb-datalake-lambda-stack --require-approval never
    cdk deploy gfb-datalake-glue-stack --require-approval never

else
    #Get Account ID
    aws configure set region ${AwsRegion} --profile ${AwsProfile}
    export AccountId=$(aws sts get-caller-identity --output text --query 'Account' --profile ${AwsProfile})

    #ECR Login for pushing Docker Image
    $(aws ecr get-login --no-include-email --region ${AwsRegion} --profile ${AwsProfile})

    cdk deploy gfb-datalake-batch-stack --require-approval never --profile ${AwsProfile}
    cdk deploy gfb-datalake-batch-job-stack --require-approval never --profile ${AwsProfile}
    build_and_push_comp_reg_image
    cdk deploy gfb-datalake-secret-manager-stack --require-approval never --profile ${AwsProfile}
    cdk deploy gfb-datalake-lambda-stack --require-approval never --profile ${AwsProfile}
    cdk deploy gfb-datalake-glue-stack --require-approval never --profile ${AwsProfile}

fi