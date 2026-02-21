#!/bin/bash
# Sync gateway tokens from running containers to the database
# Runs every 5 minutes via crontab

DB="postgresql://clawer:YOUR_DB_PASSWORD@localhost:5432/clawer"

for container in $(docker ps --format "{{.Names}}" | grep "^clawer_"); do
  TOKEN=$(docker exec "$container" cat /home/user/.openclaw/openclaw.json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['gateway']['auth']['token'])" 2>/dev/null)
  
  if [ -z "$TOKEN" ]; then
    continue
  fi

  UPDATED=$(psql "$DB" -t -c "UPDATE users SET gateway_token = '${TOKEN}' WHERE container_id = '${container}' AND (gateway_token IS NULL OR gateway_token != '${TOKEN}') RETURNING container_id;" 2>/dev/null | xargs)
  
  if [ -n "$UPDATED" ]; then
    echo "$(date +%H:%M:%S) SYNCED $container -> $TOKEN"
  fi
done
