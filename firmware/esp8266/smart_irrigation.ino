/*
  AgroVerse AI — Smart Irrigation & Precision Agriculture Platform
  ESP8266 Firmware Example
  
  Features:
  - Capacitive Soil Moisture Sensor (Analog Pin A0)
  - DHT11 / DHT22 Temperature & Humidity Sensor (Pin D4 / GPIO2)
  - 5V Relay Module controlling 12V DC Solenoid / Pump (Pin D1 / GPIO5)
  - WiFi Telemetry Dispatch via JSON POST to FastAPI backend
  - Token-Based Hardware Authentication
  - Local Automatic Threshold Failover (Protects crops even if WiFi drops)
  - Remote Command Piggybacking
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ================= CONFIGURATION =================
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API URL (Replace with your server's IP/domain)
const char* TELEMETRY_URL = "http://192.168.1.100:8000/api/telemetry";

// Device Security Credentials
const char* DEVICE_ID     = "AGRO_001";
const char* DEVICE_TOKEN  = "agro_esp8266_secure_key_2026";

// Hardware Pin Assignments
#define SOIL_PIN        A0       // Analog Soil Moisture
#define DHT_PIN         D4       // DHT22 Data Pin
#define RELAY_PIN       D1       // Relay Active LOW / HIGH
#define STATUS_LED      D0       // Onboard Status LED

#define DHT_TYPE        DHT22    // DHT11 or DHT22

// Soil Calibration Values (Tune for your sensor)
const int DRY_SOIL_ADC  = 820;   // In air / bone dry
const int WET_SOIL_ADC  = 380;   // In water / fully saturated

// Safety Setpoints
float MOISTURE_THRESHOLD_LOW = 30.0; // Auto trigger pump if < 30%
unsigned long TELEMETRY_INTERVAL_MS = 5000; // Send telemetry every 5s
unsigned long MAX_PUMP_RUNTIME_MS  = 600000; // 10 minutes max continuous

// ================= STATE VARIABLES =================
DHT dht(DHT_PIN, DHT_TYPE);
bool pumpState = false;
String operatingMode = "auto";
unsigned long lastTelemetryTime = 0;
unsigned long pumpStartTime = 0;

void setPump(bool state) {
  pumpState = state;
  // Most 5V relay modules are ACTIVE LOW (LOW = Relay ON)
  digitalWrite(RELAY_PIN, state ? LOW : HIGH);
  if (state) {
    pumpStartTime = millis();
    Serial.println("[ACTUATOR] Water Pump ENERGIZED (ON)");
  } else {
    Serial.println("[ACTUATOR] Water Pump DE-ENERGIZED (OFF)");
  }
}

float readSoilMoisture() {
  int rawADC = analogRead(SOIL_PIN);
  float percentage = map(rawADC, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100);
  percentage = constrain(percentage, 0.0, 100.0);
  return percentage;
}

void connectWiFi() {
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] Failed to connect. Operating in offline autonomous mode.");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== AgroVerse AI ESP8266 Booting ===");

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  setPump(false); // Default OFF for safety

  dht.begin();
  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  // 1. Read Physical Sensors
  float soilMoisture = readSoilMoisture();
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature)) temperature = 27.5;
  if (isnan(humidity)) humidity = 60.0;

  // 2. Local Fail-Safe Automatic Control
  // Ensures crops are irrigated even if internet/backend is completely severed
  if (operatingMode == "auto") {
    if (soilMoisture < MOISTURE_THRESHOLD_LOW && !pumpState) {
      Serial.println("[LOCAL LOGIC] Moisture below threshold. Activating pump.");
      setPump(true);
    } else if (soilMoisture >= (MOISTURE_THRESHOLD_LOW + 15.0) && pumpState) {
      Serial.println("[LOCAL LOGIC] Moisture target restored. Stopping pump.");
      setPump(false);
    }
  }

  // 3. Max Continuous Runtime Safety Watchdog
  if (pumpState && (now - pumpStartTime > MAX_PUMP_RUNTIME_MS)) {
    Serial.println("[SAFETY WATCHDOG] Maximum runtime exceeded. Auto-shutoff pump.");
    setPump(false);
  }

  // 4. Send Periodic Telemetry & Check for Commands
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClient client;
      HTTPClient http;

      http.begin(client, TELEMETRY_URL);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("Authorization", String("Bearer ") + DEVICE_TOKEN);
      http.addHeader("X-Device-Id", DEVICE_ID);

      // Construct JSON Telemetry Payload
      StaticJsonDocument<256> doc;
      doc["device_id"] = DEVICE_ID;
      doc["soil_moisture"] = soilMoisture;
      doc["temperature"] = temperature;
      doc["humidity"] = humidity;
      doc["pump"] = pumpState;
      doc["mode"] = operatingMode;
      doc["rssi"] = WiFi.RSSI();

      String requestBody;
      serializeJson(doc, requestBody);

      int httpResponseCode = http.POST(requestBody);

      if (httpResponseCode > 0) {
        String response = http.getString();
        StaticJsonDocument<256> respDoc;
        DeserializationError err = deserializeJson(respDoc, response);

        if (!err) {
          // Check for remote manual command piggybacked on response
          if (!respDoc["pending_command"].isNull()) {
            bool remoteCommand = respDoc["pending_command"].as<bool>();
            Serial.printf("[COMMAND] Received remote pump command: %s\n", remoteCommand ? "ON" : "OFF");
            operatingMode = "manual";
            setPump(remoteCommand);
          }
        }
      } else {
        Serial.printf("[HTTP] Error sending telemetry: %d\n", httpResponseCode);
      }
      http.end();
    }
  }

  delay(100);
}
