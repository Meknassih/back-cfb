#!/bin/bash
mongod --dbpath=data > log/logs.txt &
sleep 2s
nodemon src/app.js