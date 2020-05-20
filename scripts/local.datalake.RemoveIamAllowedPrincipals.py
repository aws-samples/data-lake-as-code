import logging
import boto3
from botocore.exceptions import ClientError


lf = boto3.client('lakeformation')

permissions = []

permissionResp = lf.list_permissions() 
permissions.extend(permissionResp['PrincipalResourcePermissions'])

while 'NextToken' in permissionResp:
    print(permissionResp)
    permissionResp = lf.list_permissions(NextToken=permissionResp['NextToken']) 
    permissions.extend(permissionResp['PrincipalResourcePermissions'])
    
progress = 0    
for grant in permissions:
    print("\r"+str(progress)+"/"+str(len(permissions)), end='')
    progress += 1
    if(grant['Principal']['DataLakePrincipalIdentifier'] == "IAM_ALLOWED_PRINCIPALS"):
        lf.revoke_permissions(
            Principal=grant["Principal"],
            Resource=grant["Resource"],
            Permissions=grant["Permissions"],
            PermissionsWithGrantOption=grant["PermissionsWithGrantOption"]
        )
