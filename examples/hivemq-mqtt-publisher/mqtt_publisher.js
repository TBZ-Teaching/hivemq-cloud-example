const mqtt = require('mqtt');
require('dotenv').config();

// Topic to publish synthetic sensor values to
const GARAGE_DOOR_TOPIC = 'haus1/tor';

// Read connection settings from environment variables (safer) with the provided defaults.
const HIVE_MQ_HOST = process.env.HIVE_MQ_HOST || 'fa495ec95fc74a7fbbff052baf955032.s1.eu.hivemq.cloud';
const HIVE_MQ_PORT = process.env.HIVE_MQ_PORT ? Number(process.env.HIVE_MQ_PORT) : 8883; // TLS port
const HIVE_MQ_USERNAME = process.env.HIVE_MQ_USERNAME || 'FAAS2_mqtt';
const HIVE_MQ_PASSWORD = process.env.HIVE_MQ_PASSWORD || 'FAAS2_mqtt';

const CLIENT_ID = process.env.MQTT_CLIENT_ID || `mqtt_publisher_faas2_js_${Math.random().toString(16).slice(2, 10)}`;

let garageIsOpen = false;
let client = null;

function createClient() {
  const url = `mqtts://${HIVE_MQ_HOST}:${HIVE_MQ_PORT}`;
  const options = {
    clientId: CLIENT_ID,
    username: HIVE_MQ_USERNAME,
    password: HIVE_MQ_PASSWORD,
    // by default rejectUnauthorized is true, which is recommended for HiveMQ Cloud
    rejectUnauthorized: true,
    keepalive: 60,
    reconnectPeriod: 5000, // ms between reconnection attempts
  };

  client = mqtt.connect(url, options);

  client.on('connect', () => {
    console.log(`Connected to ${HIVE_MQ_HOST}:${HIVE_MQ_PORT} as ${CLIENT_ID}`);
    // If you want to subscribe:
    // client.subscribe(GARAGE_DOOR_TOPIC, (err) => { if (!err) console.log('subscribed'); });
  });

  client.on('reconnect', () => console.log('Reconnecting...'));
  client.on('error', (err) => console.error('MQTT error:', err.message));
  client.on('close', () => console.log('Connection closed'));
  client.on('offline', () => console.log('Client offline'));
  client.on('message', (topic, payload) => {
    console.log('Received', topic, payload.toString());
  });
}

function sendFakeGarageDoorState() {
  if (!client || client.disconnected) {
    console.log('MQTT client not connected; skipping publish');
    return;
  }

  const payload = garageIsOpen ? '-0.03,0.0,-0.85' : '-0.03,0.99,0.05';
  client.publish(GARAGE_DOOR_TOPIC, payload, { qos: 0 }, (err) => {
    if (err) {
      console.error('Publish error:', err.message);
    } else {
      console.log(`Published to ${GARAGE_DOOR_TOPIC}: ${payload}`);
    }
  });

  garageIsOpen = !garageIsOpen;
}

// Start
createClient();

// Publish every 5 seconds (same schedule as your Python script)
const intervalMs = 5000;
const interval = setInterval(sendFakeGarageDoorState, intervalMs);

// Graceful shutdown on SIGINT
process.on('SIGINT', () => {
  console.log('Shutting down...');
  clearInterval(interval);
  if (client) {
    client.end(false, () => process.exit(0));
  } else {
    process.exit(0);
  }
});
