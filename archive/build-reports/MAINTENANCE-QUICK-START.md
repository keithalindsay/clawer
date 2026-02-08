# Maintenance Agent - Quick Start

## 🚀 Fastest Setup (Development)

```bash
# Run a single check
npm run maintenance

# Run continuous monitoring (daemon)
npm run maintenance:daemon
```

## 📅 Cron Setup (Production - Every 5 Minutes)

```bash
# Edit crontab
crontab -e

# Add this line (update path):
*/5 * * * * cd /opt/clawer && /usr/bin/npm run maintenance >> logs/maintenance-cron.log 2>&1
```

## 🔧 Production Systemd Service

```bash
# 1. Create service file
sudo nano /etc/systemd/system/clawer-maintenance.service

# 2. Paste this content:
[Unit]
Description=Clawer Container Maintenance Agent
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=clawer
WorkingDirectory=/opt/clawer
ExecStart=/usr/bin/npm run maintenance:daemon
Restart=always
RestartSec=10
Environment="MOONSHOT_API_KEY=sk-your-key-here"

[Install]
WantedBy=multi-user.target

# 3. Enable and start
sudo systemctl daemon-reload
sudo systemctl enable clawer-maintenance
sudo systemctl start clawer-maintenance

# 4. Check status
sudo systemctl status clawer-maintenance
sudo journalctl -u clawer-maintenance -f
```

## 📊 View Logs

```bash
# Real-time
tail -f logs/maintenance.log

# Pretty-print JSON
cat logs/maintenance.log | jq .

# Errors only
cat logs/maintenance.log | jq 'select(.level == "error")'

# Last hour
cat logs/maintenance.log | jq 'select(.timestamp > "'$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%S')'Z")'
```

## 🛟 Troubleshooting

### Docker Permission Error
```bash
# Add current user to docker group
sudo usermod -aG docker $USER
# Then log out and back in
```

### API Key Missing
```bash
# Set in .env
echo "MOONSHOT_API_KEY=sk-your-key-here" >> .env
```

### Check if Running (Systemd)
```bash
systemctl status clawer-maintenance
```

### Manual Test
```bash
npm run maintenance
# Should complete without errors and show container stats
```

## 📖 Full Documentation

See [docs/MAINTENANCE-AGENT.md](docs/MAINTENANCE-AGENT.md) for complete documentation.
