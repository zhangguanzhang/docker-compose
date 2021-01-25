#!/bin/bash
set -e

cert_dir=$PWD/cert
IMG=`grep -Pom1 'image: \K.?consul\S+' docker-compose.yml`
#nodeCount=3
days=36500
dcName=dc1

function consul(){
    docker run --rm -v $cert_dir:/opt \
    --entrypoint consul \
    --workdir /opt \
    $IMG $@
}

# ca
consul tls ca create -days=${days} 

# server
consul tls cert create -server -dc=${dcName} -days=${days} 

# client
consul tls cert create -client -dc=${dcName} -days=${days} 

# cli
consul tls cert create -cli -dc=${dcName} -days=${days} 