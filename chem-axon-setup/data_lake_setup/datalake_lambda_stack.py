from aws_cdk.aws_lambda_event_sources import S3EventSource
from aws_cdk import (
    core,
    aws_s3 as s3,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_lambda as _lambda,
    aws_s3_notifications
)

""" This module uses below parameters from config_dict passed to it :
config_dict = {
	'vpc_id': 'vpc-01234567',
	'SubnetIds': 'subnet-01234567,subnet-0123456789',
	'AvailabilityZones': 'us-east-1a,us-east-1b',
	'datalake_bucket_name': 'datalake-prod'
}
"""

class DatalakeLambdaStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, config_dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        """ Get VPC details """
        Ivpc = ec2.Vpc.from_lookup(self, "VPC", vpc_id=config_dict['vpc_id'])

        """ Get sunet seclection context created """
        subnet_1 = ec2.Subnet.from_subnet_attributes(self, "subnet_1",
                                                     subnet_id=config_dict['SubnetIds'].split(",")[0],
                                                     availability_zone=config_dict['AvailabilityZones'].split(",")[0]
                                        )
        subnet_2 = ec2.Subnet.from_subnet_attributes(self, "subnet_2",
                                                     subnet_id=config_dict['SubnetIds'].split(",")[1],
                                                     availability_zone=config_dict['AvailabilityZones'].split(",")[1]
                                        )

        """ Create Security Group for Lambda Functions """
        lambda_security_group = "datalake-lambda-sg"

        createLambdaSecurityGroup = ec2.SecurityGroup(self, "createLambdaSecurityGroup",
                                                     vpc=Ivpc,
                                                     allow_all_outbound=True,
                                                     description="This security group will be used for Lambda Funcs",
                                                     security_group_name=lambda_security_group
                                        )

        """ Create the Datalake Bucket """
        createDatalakeBucket = s3.Bucket(self, "createCompRegBucket",
                                        bucket_name=config_dict['datalake_bucket_name'],
                                        block_public_access=s3.BlockPublicAccess(block_public_acls=True,
                                                                                 block_public_policy=True,
                                                                                 ignore_public_acls=True,
                                                                                 restrict_public_buckets=True
                                                                                 )
                                        )

        core.CfnOutput(self, "createCompRegBucketName", value=createDatalakeBucket.bucket_name)


        """ Create Comp Reg Lambda Function """
        createCompRegLambda = _lambda.Function(
                                    self, "createCompRegLambda",
                                    function_name="datalake-comp-reg-trigger",
                                    description="This lambda function will trigger the compound reg pipeline.",
                                    runtime=_lambda.Runtime.PYTHON_3_7,
                                    handler="trigger_compound_reg_pipeline.lambda_handler",
                                    code=_lambda.Code.asset('lambdas'),
                                    timeout=core.Duration.seconds(90),
                                    vpc=Ivpc,
                                    vpc_subnets=ec2.SubnetSelection(subnets=[subnet_1, subnet_2]),
                                    security_group=createLambdaSecurityGroup,
                                    initial_policy=[iam.PolicyStatement(effect=iam.Effect.ALLOW,
                                                                        actions=["s3:*", "batch:*"],
                                                                        resources=["*"])
                                                    ]
                    )

        """ Add s3 event trigger to above lambda function """
        createCompRegLambda.add_event_source(S3EventSource(
                                                        createDatalakeBucket,
                                                        events=[s3.EventType.OBJECT_CREATED],
                                                        filters=[s3.NotificationKeyFilter(
                                                                prefix="compound_reg/triggers/",
                                                                suffix=".trigger"
                                                                )
                                                        ]
                                            )
                                )