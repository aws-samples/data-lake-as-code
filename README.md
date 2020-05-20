<h1 id='HPG9CA7YL2o'>Data Lake as Code; Featuring ChEMBL and Open Targets</h1>

Companion code for upcoming AWS blogpost on enrolling chembl and opentargets into a data lake on AWS<br/>

<div data-section-style='11' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/D5akZWKUWmfWEhA8u4loEA?a=U93UPcmkUsuoToxZr2QpWU5nosB1RwimIsIW5TtaJvEa' id='HPG9CASUn8g' alt='' width='800' height='380'></img></div><h2 id='HPG9CAlPR6i'>To install this in your own AWS account:</h2>

Your local machine needs to have the AWS CLI installed on your machine along with IAM permissions setup (through IAM role or .aws/credentials file). I like to use Cloud9 as my IDE as it comes with both of those already setup for me.<br/>

<br/>

Run the following commands<br/>

<pre id='HPG9CAKfUT3'>git clone https://github.com/paulu-aws/chembl-opentargets-data-lake-example.git<br>cd chembl-opentargets-data-lake-example<br>./InstallCdkDependencies.sh<br>./DeployChemblOpenTargetsEnv.sh</pre>

Wait for Chembl and OpenTargets to be ‘staged’ into the baseline stack.<br/>

<br/>

The ‘baseline stack’ in the CDK application spins up a VPC with an S3 bucket (for OpenTargets) and an RDS Postgres instance (for Chembl). It also spins up a little helper EC2 instance that stages those assets in their ‘raw’ form after downloading them from<a href="http://OpenTargets.org"> OpenTargets.org</a> and EMBL-EBI.<br/>

<br/>

Go to Systems Manager in the AWS console, and then the ‘Run Command’ section. You will see the currently running command documents. <br/>

<div data-section-style='11' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/x4lfduQeC3Ww-DyK8loIAg?a=6aMBuWAgnWaZ5pQaJndaM06ob734VpmiCI5xfguyPaca' id='HPG9CA9WNsB' alt='' width='1276' height='612'></img></div><br/>

It takes about an hour for Chembl to build. If you get impatient and want to see the progress in real time, go to ‘Session Manager’ in the Systems Manager console, click the ‘Start session’ button, choose the ‘ChembDbImportInstance’ radio button, and click the ‘Start Session’ button.<br/>

<br/>

<div data-section-style='11' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/Fj7sA3VuIuvdPOHl017Xcg?a=EYFlHaKY8weEGFezDR4ld3sEhBMWl88afFdDjJQ15H8a' id='HPG9CADqhgF' alt='' width='1242' height='666'></img></div><br/>

That will open a SSM session window. Run the following command to tail the log output.<br/>

<pre id='HPG9CAuziva'>tail -f /home/ssm-user/progressLog</pre>

<br/>

<div data-section-style='11' class='tall' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/rMcRhjzUcIGQVYeBFxup4Q?a=2NRscRrktD9kLK7rDqqD9bO3aXtTYttCeaEWLwDXVgIa' id='HPG9CAgo8Yy' alt='' width='1115' height='1030'></img></div><br/>

<h2 id='HPG9CAe1Pmp'>Enroll Chembl and OpenTargets into the data lake</h2>

Once the database has finished importing, go to Glue in the AWS console, and then the “Workflows” section<br/>

<br/>

<div data-section-style='11' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/K0liqaLzOGNHdODU_fN_MA?a=GQQahtSxVQNvaU6AkEjATwCE0WJglr630LH3bZcngB0a' id='HPG9CADnepH' alt='' width='1177' height='631'></img></div><br/>

Select the openTargetsDataLakeEnrollment workflow, and click ‘Actions’, then 'Run'<br/>

<br/>

<div data-section-style='11' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/UV0-ZlwmK_KF9L9MfaUgfA?a=97k7vof4qlurzy3zSsmPVhomgCpRUJfREq8UCNZSzt4a' id='HPG9CAgkuAH' alt='' width='1177' height='631'></img></div><br/>

Do the same for the chemblDataLakeEnrollmentWorkflow. Wait for the workflows to finish.<br/>

<br/>

Both workflows will run in parallel, but it will take the openTargetsDataLakeEnrollmentWorkflow ~170 minutes to complete while the Chembl enrollment will finish in about 30 minutes. <br/>

<h2 id='HPG9CAYpovV'>Query an Conquer!</h2>

Go to Athena in the AWS Console.<br/>

<br/>

If you havent used Athena in your account before, you will need to define a storage location for your query results. Click on the ‘Settings’ tab in the top right and specify a bucket name where you would like Athena results stored and click save.<br/>

<div data-section-style='11' style=''><img src='https://quip-amazon.com/blob/HPG9AAwumxR/d9imQFzWnNdhWYDAo9Bt1A?a=8Q4UOXPqvG1fk3knDX9x2wr9Jeu9g8V2tPRYsnE3Vlga' id='HPG9CASHmiz' alt='' width='800' height='429'></img></div><br/>

Now, click the ‘Databases’ dropdown:<br/>

<br/>

You will see 4 databases listed, you only want to use 2 of them:<br/>

<br/>

<u><i><b>Use:</b></i></u><br/>

<br/>

<b>chembl-25-dl </b>- This is the ‘dl’ or ‘data lake’ Chembl database. Always use tables in this database when running Chembl queries. Part of the chemblDataLakeEnrollment workflow converts the ‘source’ Chembl Postgres formats into a ‘data lake’ friendly parquet format optimized for Athena. <br/>

<br/>

<b>opentargets-1911-dl </b>- This is the ‘dl’ or ‘data lake’ OpenTargets database. Always use this table when running OpenTarget queries. Part of the chemblDataLakeEnrollment workflow converts the ‘source’ OpenTargets json and csv formats into a ‘data lake’ parquet format optimized for Athena. <br/>

<br/>

<u><i><b>Dont use:</b></i></u><br/>

<br/>

<b>chembl-25-src - </b>This represents the ‘src’ or ‘source’ Chembl postgres database. By design, the source database is not directly queryable from Athena, so you will not use this database. <br/>

<br/>

<b>opentargets-1911-src - </b>This is the ‘src’ or ‘source’ table. When you query this table, you are directly querying the original chembl json and csv files<b> </b>from OpenTargets. The performance may be slow as those formats are not optimized for querying with Athena. <br/>

<br/>

<br/>
