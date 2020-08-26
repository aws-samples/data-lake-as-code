ARG PYTHON_VERSION
ARG UBUNTU_VERSION
FROM ubuntu:${UBUNTU_VERSION} AS client
ARG ORACLE_VERSION
ARG ORACLE_ZIP_INTERNAL_FOLDER
WORKDIR /root
ENV CLIENT_ZIP=instantclient-basiclite-linux.x64-${ORACLE_VERSION}.zip
ENV SDK_ZIP=instantclient-sdk-linux.x64-${ORACLE_VERSION}.zip

RUN apt-get update && apt-get -yq install unzip
COPY ${CLIENT_ZIP} .
COPY ${SDK_ZIP} .
RUN unzip ${CLIENT_ZIP}
RUN unzip ${SDK_ZIP}
RUN mv ${ORACLE_ZIP_INTERNAL_FOLDER} oracle

FROM python:${PYTHON_VERSION}
LABEL maintainer=spate@goldficnhbio.com
ARG ORACLE_VERSION
ENV HOME /root
ENV ORACLE_HOME /opt/oracle
ENV TNS_ADMIN ${ORACLE_HOME}/network/admin
VOLUME ["${TNS_ADMIN}"]

COPY --from=client /root/oracle ${ORACLE_HOME}
RUN apt-get update \
	&& apt-get -yq install libaio1 \
	&& apt-get -yq install vim \
	&& apt-get -yq autoremove \
	&& apt-get clean \
	# Install Oracle Instant Client
	&& echo ${ORACLE_HOME} > /etc/ld.so.conf.d/oracle.conf \
	&& mkdir -p ${TNS_ADMIN} \
	&& ldconfig \
	&& rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN pip install numpy pandas boto3 s3fs fastparquet mypy_extensions psutil awscli toolz dask cx_Oracle

RUN mkdir /scripts
WORKDIR /scripts
ADD comp_reg_data_load.py /scripts