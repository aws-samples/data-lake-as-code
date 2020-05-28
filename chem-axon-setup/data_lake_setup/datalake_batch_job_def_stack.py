from aws_cdk import (
    core,
    aws_batch as batch,
    aws_ecs as ecs,
    aws_ecr as ecr
)

""" This module uses below parameters from config_dict passed to it :
config_dict = {
	'workflow_ecr_repo': 'datalake-repo',
	'datalake_bucket_name': 'datalake-prod',
	'workflow_comp_reg_image_version': 'comp-reg-1.0',
	'comp_reg_secret_name': 'CompRegConn'
}

"""
class DatalakeBatchJobStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, config_dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        """ get Comp Reg ECR Image details """
        comp_reg_image_id = ecs.ContainerImage.from_ecr_repository(
                                        repository=ecr.Repository.from_repository_name(self, "GetCompRegRepoName",
                                                       repository_name=config_dict['workflow_ecr_repo']
                                                    ),
                                        tag=config_dict['workflow_comp_reg_image_version']
                            )

        """ Create Comp Reg Batch Job Definition """
        createCompRegJob = batch.JobDefinition(self, "createCompRegJob",
                                job_definition_name="comp-reg-etl-job",
                                retry_attempts=2,
                                container=batch.JobDefinitionContainer(
                                        image=comp_reg_image_id,
                                        memory_limit_mib=4000,
                                        vcpus=1,
                                        environment=dict(
                                            COMPREG_ORACLE_SECRET_NAME=config_dict['comp_reg_secret_name'],
                                            COMPREG_BUCKET=config_dict['datalake_bucket_name']
                                            )
                                )
                    )

        core.CfnOutput(self, "createCompRegJobName", value=createCompRegJob.job_definition_name)