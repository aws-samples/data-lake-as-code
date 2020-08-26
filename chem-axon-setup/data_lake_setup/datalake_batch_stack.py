from aws_cdk import (
    core,
    aws_batch as batch,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_ecr as ecr
)

""" This module uses below parameters from config_dict passed to it :
config_dict = {
	'vpc_id': 'vpc-01234567',
	'SubnetIds': 'subnet-01234567,subnet-0123456789',
	'AvailabilityZones': 'us-east-1a,us-east-1b',
	'workflow_ecr_repo': 'datalake-repo'
}
"""

class DatalakeBatchStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, config_dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        """ Get VPC details """
        vpc = ec2.Vpc.from_lookup(self, "VPC", vpc_id=config_dict['vpc_id'])

        """ Create Security Group for Batch Env """
        batch_security_group = "datalake-batch-security-group"

        createBatchSecurityGroup = ec2.SecurityGroup(self, "createBatchSecurityGroup",
                                        vpc=vpc,
                                        allow_all_outbound=True,
                                        description="This security group will be used for AWS Batch Compute Env",
                                        security_group_name=batch_security_group)

        createBatchSecurityGroup.add_ingress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port(protocol=ec2.Protocol.TCP,
                                string_representation="ingress_rule",
                                from_port=22,
                                to_port=22)
        )

        createBatchSecurityGroup.add_egress_rule(
            peer=ec2.Peer.ipv4("0.0.0.0/0"),
            connection=ec2.Port(protocol=ec2.Protocol.TCP,
                                string_representation="egress_rule",
                                from_port=-1,
                                to_port=-1)
        )

        core.CfnOutput(self, "createBatchSecurityGroupId", value=createBatchSecurityGroup.security_group_id)

        """ Create IAM Role for ecsInstance """
        createECSInstanceRole = iam.Role(self, "createECSInstanceRole",
                                assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
                                description="This instance role will be used by the ECS cluster instances",
                                managed_policies=[
                                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonEC2FullAccess"),
                                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonS3FullAccess"),
                                    iam.ManagedPolicy.from_aws_managed_policy_name("AWSBatchFullAccess"),
                                    iam.ManagedPolicy.from_aws_managed_policy_name("SecretsManagerReadWrite"),
                                    iam.ManagedPolicy.from_aws_managed_policy_name("AmazonAthenaFullAccess"),
                                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/"
                                                                               "AmazonEC2ContainerServiceforEC2Role"),
                                    iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSBatchServiceRole")
                                ],
                                role_name="datalake-ecsinstance-role"
                )

        createInstanceProfile = iam.CfnInstanceProfile(self, "createInstanceProfile",
                                                       roles=[createECSInstanceRole.role_name],
                                                       instance_profile_name="datalake-ecsinstance-role"
                                                       )

        useECSInstanceProfile = createInstanceProfile.instance_profile_name

        core.CfnOutput(self, "createECSInstanceRoleName", value=createECSInstanceRole.role_name)

        """ Create Spot Fleet Role """
        createSpotFleetRole = iam.Role(self, 'createSpotFleetRole',
            assumed_by=iam.ServicePrincipal("spotfleet.amazonaws.com"),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
            "service-role/AmazonEC2SpotFleetTaggingRole")]
        )

        core.CfnOutput(self, "createSpotFleetRoleName", value=createSpotFleetRole.role_name)

        useSpotFleetRole = createSpotFleetRole.without_policy_updates()

        """ Create Batch Service Role """
        createBatchServiceRole = iam.Role(self, 'createBatchServiceRole',
                                          assumed_by=iam.ServicePrincipal("batch.amazonaws.com"),
                                          managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name(
                                              "service-role/AWSBatchServiceRole")]
                                          )

        core.CfnOutput(self, "createBatchServiceRoleName", value=createBatchServiceRole.role_name)

        useBatchServiceRole = createBatchServiceRole.without_policy_updates()


        """ Create Compute Environment """

        subnet_1 = ec2.Subnet.from_subnet_attributes(self, "subnet_1",
                                                     subnet_id=config_dict['SubnetIds'].split(",")[0],
                                                     availability_zone=config_dict['AvailabilityZones'].split(",")[0])
        subnet_2 = ec2.Subnet.from_subnet_attributes(self, "subnet_2",
                                                     subnet_id=config_dict['SubnetIds'].split(",")[1],
                                                     availability_zone=config_dict['AvailabilityZones'].split(",")[1])



        createBatchComputeEnv = batch.ComputeEnvironment(self, "createBatchComputeEnv",
                                                compute_environment_name="datalake-compute-env",
                                                service_role=useBatchServiceRole,
                                                compute_resources=batch.ComputeResources(
                                                     vpc=vpc,
                                                     type=batch.ComputeResourceType.SPOT,
                                                     bid_percentage=60,
                                                     desiredv_cpus=0,
                                                     maxv_cpus=100,
                                                     minv_cpus=0,
                                                     security_groups=[createBatchSecurityGroup],
                                                     vpc_subnets=ec2.SubnetSelection(subnets=[subnet_1, subnet_2]),
                                                     instance_role=useECSInstanceProfile,
                                                     spot_fleet_role=useSpotFleetRole,
                                                     compute_resources_tags=core.Tag.add(self,
                                                                                        'Name',
                                                                                        'Datalake Pipeline Instance'
                                                                                    )
                                                        )
                                                )

        core.CfnOutput(self, "createBatchComputeEnvName", value=createBatchComputeEnv.compute_environment_name)

        getIComputeEnvObject = batch.ComputeEnvironment.from_compute_environment_arn(
                                                self, "getComputeEnvAtrributes",
                                                compute_environment_arn=createBatchComputeEnv.compute_environment_arn
                                         )

        """ Create Batch Job Queue """
        createBatchJobQueue = batch.JobQueue(self, "createBatchJobQueue",
                                             compute_environments=[batch.JobQueueComputeEnvironment(
                                                 compute_environment=getIComputeEnvObject,
                                                 order=1
                                             )],
                                             enabled=True,
                                             job_queue_name="datalake-job-queue",
                                             priority=1)

        core.CfnOutput(self, "createBatchJobQueueName", value=createBatchJobQueue.job_queue_name)

        """ Create ECR Repo for datalake images """
        createECRRepo = ecr.Repository(self, "createECRRepo", repository_name=config_dict['workflow_ecr_repo'])

        core.CfnOutput(self, "createECRRepoName", value=createECRRepo.repository_name)