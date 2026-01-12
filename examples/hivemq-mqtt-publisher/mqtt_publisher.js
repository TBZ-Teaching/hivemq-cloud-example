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
let lastPublishedState = null;
let stateChangeCounter = 0;

// Acceleration thresholds for state detection
const CLOSED_Y_THRESHOLD = 0.85;   // Y-axis >= 0.85 = door closed
const OPEN_Z_THRESHOLD = -0.85;    // Z-axis <= -0.85 = door open
                                    // Otherwise = not defined

/**
 * Analyzes 3-axis acceleration values to determine door state
 * Geschlossenes Tor: y >= 0.85
 * Geöffnetes Tor: z <= -0.85
 * Undefined: all other cases
 */
function detectDoorState(x, y, z) {
  if (y >= CLOSED_Y_THRESHOLD) {
    return 'closed';
  } else if (z <= OPEN_Z_THRESHOLD) {
    return 'open';
  }
  
  // Not defined/uncertain state
  return null;
}

/**
 * Generates realistic acceleration values based on door state
 */
function generateAccelerationValues(state) {
  // Add small random fluctuations to simulate real sensor noise
  const noise = () => (Math.random() - 0.5) * 0.05;
  
  if (state === 'closed') {
    // Door closed: X ≈ -0.03, Y ≈ 0.99, Z ≈ 0.05
    return {
      x: -0.03 + noise(),
      y: 0.99 + noise(),
      z: 0.05 + noise()
    };
  } else if (state === 'open') {
    // Door open: X ≈ -0.09, Y ≈ 0.03, Z ≈ -0.92
    return {
      x: -0.09 + noise(),
      y: 0.03 + noise(),
      z: -0.92 + noise()
    };
  } else if (state === 'uncertain') {
    // Uncertain state: y < 0.85 AND z > -0.85 (door in transition/intermediate position)
    return {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.85,  // y < 0.85
      z: (Math.random() - 0.5) * 0.8   // z between -0.4 and 0.4 (> -0.85)
    };
  }
  
  return null;
}

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

  // Determine current state: closed (0-2), open (3-5), uncertain (randomly 1 in 10)
  let currentState;
  const randomCheck = Math.random();
  
  if (randomCheck < 0.1) {
    // 10% chance of uncertain state
    currentState = 'uncertain';
  } else if (stateChangeCounter < 3) {
    currentState = 'closed';
  } else {
    currentState = 'open';
  }
  
  const accelData = generateAccelerationValues(currentState);
  
  if (!accelData) {
    console.log('No valid acceleration data generated');
    return;
  }

  // Format payload as comma-separated values (x,y,z)
  const payload = `${accelData.x.toFixed(2)},${accelData.y.toFixed(2)},${accelData.z.toFixed(2)}`;
  
  // Detect state from acceleration values
  const detectedState = detectDoorState(accelData.x, accelData.y, accelData.z);
  
  // Publish every time
  client.publish(GARAGE_DOOR_TOPIC, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error('Publish error:', err.message);
    } else {
      console.log(`[${new Date().toISOString()}] Published to ${GARAGE_DOOR_TOPIC}: ${payload} (${detectedState || 'None'})`);
    }
  });

  // Change state every 6 readings (every 30 seconds with 5s interval)
  stateChangeCounter++;
  if (stateChangeCounter >= 6) {
    stateChangeCounter = 0;
  }
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
