# hivemq-cloud-example

A simple web-based MQTT publisher demo for HiveMQ Cloud.

## Overview

This project provides an HTML/JavaScript application that connects to a HiveMQ Cloud broker and regularly publishes sensor-like data to an MQTT topic.

## Features

- Connect to HiveMQ Cloud using WebSocket Secure (WSS)
- Configurable broker URL, credentials, topic, and publish interval
- Publishes JSON payloads with timestamp, temperature, humidity, and message ID
- Real-time status display and message logging
- Simple, standalone HTML file - no build tools required

## Usage

1. Open `mqtt-publisher.html` in a web browser
2. Enter your HiveMQ Cloud connection details:
   - **Broker URL**: Your HiveMQ Cloud cluster URL (e.g., `your-cluster.s1.eu.hivemq.cloud`)
   - **WebSocket Port**: Usually `8884` for HiveMQ Cloud
   - **Username**: Your HiveMQ Cloud username
   - **Password**: Your HiveMQ Cloud password
   - **Topic**: The MQTT topic to publish to (default: `test/topic`)
   - **Publish Interval**: How often to publish messages in seconds (default: 5)
3. Click "Connect" to establish the connection
4. The application will start publishing JSON data at the specified interval
5. Click "Disconnect" to stop publishing and close the connection

## Sample Payload

Each published message contains:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "temperature": "25.43",
  "humidity": "55.21",
  "messageId": 1
}
```

## Requirements

- A modern web browser with JavaScript enabled
- A HiveMQ Cloud account with WebSocket access enabled
- Internet connection to load MQTT.js from CDN

## Getting a HiveMQ Cloud Account

1. Visit [HiveMQ Cloud](https://www.hivemq.com/cloud/)
2. Sign up for a free account
3. Create a new cluster
4. Note your cluster URL and create access credentials

## License

This project is provided as-is for educational purposes