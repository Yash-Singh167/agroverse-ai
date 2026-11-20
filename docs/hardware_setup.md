# AgroVerse AI — ESP8266 Hardware Setup & Pinout Specification

This document provides complete instructions for wiring the physical sensors and actuator to an ESP8266 NodeMCU (or D1 Mini) microcontroller.

---

## 1. Bill of Materials (BOM)

| Component | Specification | Quantity |
|---|---|:---:|
| **Microcontroller** | ESP8266 NodeMCU v2/v3 or WeMos D1 Mini | 1 |
| **Soil Moisture Sensor** | Capacitive Soil Moisture Sensor v1.2 (Corrosion Resistant) | 1 |
| **Climate Sensor** | DHT22 (AM2302) or DHT11 Temperature & Humidity Sensor | 1 |
| **Relay Module** | 5V Single-Channel Relay (Optocoupler Isolated, Active LOW) | 1 |
| **Water Actuator** | 12V DC Submersible Water Pump / Solenoid Valve | 1 |
| **Power Supply** | 12V 2A DC Power Adapter + 5V Step-Down Buck Converter (LM2596) | 1 |
| **Tubing** | 1/4-inch Drip Irrigation Tubing with Micro-Emitters | 1 Set |

---

## 2. Wiring & Pinout Map

```
        +-----------------------------------------------+
        |               ESP8266 NodeMCU                 |
        |                                               |
        |   A0  [Analog]  <--- Soil Sensor Signal (AOUT)|
        |   D4  [GPIO 2]  <--- DHT22 Data Pin           |
        |   D1  [GPIO 5]  ---> Relay Module IN Pin      |
        |   3V3 [Power]   ---> Soil Sensor VCC          |
        |   VIN [5V IN]   <--- 5V Regulated Power       |
        |   GND [Ground]  <--- Common Ground            |
        +-----------------------------------------------+
```

### Detailed Connections:

#### 1. Capacitive Soil Moisture Sensor (Analog)
* **VCC** &rarr; ESP8266 **3V3** (Do not connect to 5V to keep ADC output within 0-1.0V)
* **GND** &rarr; ESP8266 **GND**
* **AOUT (Signal)** &rarr; ESP8266 **Pin A0**

#### 2. DHT22 Temperature & Humidity Sensor (Digital)
* **Pin 1 (VCC)** &rarr; ESP8266 **3V3** or **5V**
* **Pin 2 (Data)** &rarr; ESP8266 **Pin D4 (GPIO 2)** *(Add 10kΩ pull-up resistor between VCC and Data if module lacks onboard resistor)*
* **Pin 3 (NC)** &rarr; Not connected
* **Pin 4 (GND)** &rarr; ESP8266 **GND**

#### 3. 5V Relay Module & Water Pump
* **VCC** &rarr; ESP8266 **VIN (5V)**
* **GND** &rarr; ESP8266 **GND**
* **IN (Signal)** &rarr; ESP8266 **Pin D1 (GPIO 5)**
* **Relay COM (Common)** &rarr; **+12V DC Power Supply Positive**
* **Relay NO (Normally Open)** &rarr; **Pump Positive Terminal**
* **Pump Negative Terminal** &rarr; **12V DC Power Supply Ground (Common GND)**

---

## 3. Sensor Calibration Routine

1. **Dry Reading**:
   - Suspend sensor in dry air. Open Arduino Serial Monitor at 115200 baud.
   - Record the raw ADC value: typically `~820`. Update `DRY_SOIL_ADC = 820;` in `smart_irrigation.ino`.
2. **Wet Reading**:
   - Insert sensor into a cup of water up to the white stop line.
   - Record raw ADC value: typically `~380`. Update `WET_SOIL_ADC = 380;` in `smart_irrigation.ino`.
3. **Flash Firmware**:
   - Install `ESP8266WiFi`, `ArduinoJson` (v6 or v7), and `DHT sensor library` in the Arduino IDE.
   - Select Board: `NodeMCU 1.0 (ESP-12E Module)`.
   - Upload sketch `firmware/esp8266/smart_irrigation.ino`.
