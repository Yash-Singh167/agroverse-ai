# AgroVerse AI — ESP8266 Microcontroller Firmware

This folder contains the Arduino C++ firmware for the AgroVerse AI hardware node.

## Files
- `smart_irrigation.ino`: Main microcontroller code.
  - Periodic JSON telemetry dispatch over HTTP POST.
  - Continuous local fail-safe automatic threshold checks (survives offline operation).
  - Remote command reception piggybacked onto telemetry response.
  - 10-minute continuous pump runtime safety watchdog.

## Requirements
- Arduino IDE 2.x
- ESP8266 Core for Arduino (v3.0.0+)
- Libraries:
  - `ArduinoJson` (v6 or v7)
  - `DHT sensor library` by Adafruit
  - `Adafruit Unified Sensor`

## Pin Configuration
- `A0`: Analog Capacitive Soil Moisture Sensor
- `D4` (GPIO2): DHT22 / DHT11 Temperature & Humidity Sensor
- `D1` (GPIO5): 5V Relay Signal (Active LOW)
- `D0` (GPIO16): Status LED
