#!/usr/bin/env bash
echo "Starting StageMaker api"
NODE_ENV=production pm2 start server.js -- --port 3018 --name "StageMakerApi" 
