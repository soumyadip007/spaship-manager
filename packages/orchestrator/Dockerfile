#!/bin/bash

FROM ubuntu:20.04

RUN apt-get update
RUN apt-get --force-yes upgrade  -y
RUN apt-get dist-upgrade
RUN apt-get  install -y build-essential
RUN  apt-get install sudo

RUN apt-get install --yes curl
RUN apt update
RUN curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
RUN apt-get  --force-yes install -y nodejs
RUN apt-get install --yes build-essential
RUN apt-get install --only-upgrade bash

RUN apt  --force-yes install -y libssl-dev
RUN apt-get --force-yes install -y  libpcre3 libpcre3-dev
RUN apt-get install libssl-dev
RUN  apt --force-yes install  -y libgit2-dev

RUN sudo dpkg --add-architecture i386
RUN sudo apt-get update
RUN sudo apt-get --force-yes install -y libstdc++6:i386 libgcc1:i386 libcurl4-gnutls-dev:i386
RUN node -v

ADD  . /app
WORKDIR /app

RUN find . -name "node_modules" -exec rm -rf '{}' +
RUN sudo chmod -R 777 /app
RUN ls && npm install
RUN sudo chmod -R 777 /app

ENV DB_CON=mongo.spaship:27017
EXPOSE 3000
CMD [ "npm", "run", "start"]