<h1 id='HPG9CA7YL2o'>Chembl and Open Targets in an AWS Data Lake</h1>

Companion code for upcoming AWS blogpost on enrolling chembl and opentargets into a data lake on AWS<br/>

<h2 id='HPG9CAlPR6i'>To install this in your own AWS account:</h2>

Your local machine needs to have the AWS CLI installed on your machine along with IAM permissions setup (through IAM role or .aws/credentials file). I like to use Cloud9 as my IDE as it comes with both of those already setup for me.<br/>

<br/>

Run the following commands<br/>

<pre id='HPG9CAKfUT3'>git clone https://github.com/paulu-aws/chembl-opentargets-data-lake-example.git<br>cd chembl-opentargets-data-lake-example<br>./InstallCdkDependencies.sh<br>./DeployChemblOpenTargetsEnv.sh</pre>

Wait for Chembl and OpenTargets to be ‘staged’ into the baseline stack.<br/>

<br/>

The ‘baseline stack’ in the CDK application spins up a VPC with an S3 bucket (for OpenTargets) and an RDS Postgres instance (for Chembl). It also spins up a little helper EC2 instance that stages those assets in their ‘raw’ form after downloading them from<a href="http://OpenTargets.org"> OpenTargets.org</a> and EMBL-EBI.<br/>

<br/>

Go to Systems Manager in the AWS console, and then the ‘Run Command’ section. You will see the currently running command documents. <br/>

<div data-section-style='11' style='max-width:168%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/x4lfduQeC3Ww-DyK8loIAg?a=6aMBuWAgnWaZ5pQaJndaM06ob734VpmiCI5xfguyPaca' id='HPG9CA9WNsB' alt='' width='1276' height='612'></img></div>It takes about an hour for Chembl to build. If you get impatient and want to see the progress in real time, go to ‘Session Manager’ in the Systems Manager console, click the ‘Start session’ button, choose the ‘ChembDbImportInstance’ radio button, and click the ‘Start Session’ button.<br/>

<div data-section-style='11' style='max-width:155%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/Fj7sA3VuIuvdPOHl017Xcg?a=EYFlHaKY8weEGFezDR4ld3sEhBMWl88afFdDjJQ15H8a' id='HPG9CADqhgF' alt='' width='1242' height='666'></img></div>That will open a SSM session window. Run the following command to tail the log output.<br/>

<pre id='HPG9CAuziva'>tail -f /home/ssm-user/progressLog</pre>

<div data-section-style='11' class='tall' style='max-width:147%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/rMcRhjzUcIGQVYeBFxup4Q?a=2NRscRrktD9kLK7rDqqD9bO3aXtTYttCeaEWLwDXVgIa' id='HPG9CAgo8Yy' alt='' width='1115' height='1030'></img></div><br/>

<h2 id='HPG9CAe1Pmp'>Enroll Chembl and OpenTargets into the data lake</h2>

Once the database has finished importing, go to Glue in the AWS console, and then the “Workflows” section<br/>

<div data-section-style='11' style='max-width:147%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/K0liqaLzOGNHdODU_fN_MA?a=GQQahtSxVQNvaU6AkEjATwCE0WJglr630LH3bZcngB0a' id='HPG9CADnepH' alt='' width='1177' height='631'></img></div>Select the openTargetsDataLakeEnrollment workflow, and click ‘Actions’, then 'Run'<br/>

<div data-section-style='11' style='max-width:147%'><img src='https://quip-amazon.com/blob/HPG9AAwumxR/UV0-ZlwmK_KF9L9MfaUgfA?a=97k7vof4qlurzy3zSsmPVhomgCpRUJfREq8UCNZSzt4a' id='HPG9CAgkuAH' alt='' width='1177' height='631'></img></div>Do the same for the chemblDataLakeEnrollmentWorkflow<br/>

Wait for the workflows to finish.<br/>

<br/>

You can now query opentargets and chembl data through Athena!<br/>

<br/>