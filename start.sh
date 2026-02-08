#!/bin/bash
cd /opt/clawer
set -a
source .env
set +a
exec npm start
