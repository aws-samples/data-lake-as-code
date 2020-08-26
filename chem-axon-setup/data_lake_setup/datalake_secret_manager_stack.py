from aws_cdk import (
    core,
    aws_secretsmanager as sm
)

""" This module uses below parameters from config_dict passed to it :
config_dict = {
	'comp_reg_secret_name': 'CompRegConn',
	'comp_reg_host_name': 'db_endpoint_host_name',
	'comp_reg_port': 'db_port',
	'comp_reg_db_name': 'db_name',
	'comp_reg_user_name': 'db_user',
	'comp_reg_password': 'db_pass'
}
"""

class DatalakeSecretManagerStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, config_dict, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        """ Create a secret in secret manager with Database credentials for Comp Reg Source """
        stack = DatalakeSecretManagerStack.of(self)

        createCompRegSecret = sm.Secret(self, "createCompRegSecret",
                                        description="Database credentials for Comp Reg Source",
                                        secret_name=config_dict['comp_reg_secret_name'],
                                        generate_secret_string=sm.SecretStringGenerator(
                                            exclude_characters="{`~!@#$%^&*()_-+={[}}|\:;\"'<,>.?/}",
                                            generate_string_key="pass_generated_by_SM",
                                            secret_string_template=stack.to_json_string({
                                                'db_username': config_dict['comp_reg_user_name'],
                                                'db_password': config_dict['comp_reg_password'],
                                                'db_port': config_dict['comp_reg_port'],
                                                'db_service_name': config_dict['comp_reg_db_name'],
                                                'db_host': config_dict['comp_reg_host_name']
                                            })
                                        )
                                    )

