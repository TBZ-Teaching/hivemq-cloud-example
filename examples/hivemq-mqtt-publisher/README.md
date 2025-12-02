# HiveMQ MQTT Publisher (Node.js)

This script publishes synthetic garage-door sensor values to the topic `haus1/tor` every 5 seconds.

Files added:
- mqtt_publisher.js
- package.json
- .env.example

Usage (recommended):
1. Copy `.env.example` to `.env` and set your credentials (or set environment variables in your environment/CI).
2. Install dependencies:
   npm install
3. Run:
   npm start

Environment variables:
- HIVE_MQ_HOST (default provided)
- HIVE_MQ_PORT (default 8883)
- HIVE_MQ_USERNAME
- HIVE_MQ_PASSWORD
- MQTT_CLIENT_ID (optional)

Notes:
- The script uses TLS (mqtts) to connect to HiveMQ Cloud on port 8883.
- Do not commit real credentials to the repo. Use environment variables or your CI/CD secrets.
