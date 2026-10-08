# AquaSave: Hardware Integration Guide

This guide details the physical hardware architecture, sensor connections, firmware, and payload specification for connecting ESP32 microcontroller units to the AquaSave SCADA platform.

---

## 1. Hardware Bill of Materials (BOM)

| Component          | Model / Spec                                | Purpose                                          | Operating Voltage                |
| ------------------ | ------------------------------------------- | ------------------------------------------------ | -------------------------------- |
| Microcontroller    | ESP-32 DevKit v1 (30-pin / 38-pin)          | Telemetry collection & HTTP dispatch             | 3.3V (5V via USB)                |
| Water Level Sensor | HC-SR04 / JSN-SR04T (Waterproof Ultrasonic) | Non-contact reservoir depth measurement          | 5.0V (Echo stepped down to 3.3V) |
| Flow Rate Sensor   | YF-S201 (1/2" Hall Effect Turbine)          | Discharge and inlet fluid flow metering          | 5.0V                             |
| Resistor Divider   | 1kΩ & 2kΩ resistors                         | Level shifter for HC-SR04 Echo pin to ESP32 GPIO | Passive                          |
| Power Supply       | 5V 2A Micro-USB / External 5V Buck          | Clean DC power for sensors and MCU               | 5.0V                             |

---

## 2. Wiring Schematic & Pinout

```
+-------------------+--------------------+------------------------+
| Sensor Pin        | ESP32 Pin          | Notes                  |
+-------------------+--------------------+------------------------+
| HC-SR04 VCC       | VIN (5V)           | Ultrasonic sensor power|
| HC-SR04 GND       | GND                | Common ground          |
| HC-SR04 TRIG      | GPIO 5 (D5)        | Trigger pulse output   |
| HC-SR04 ECHO      | GPIO 18 (via 1k/2k)| 5V -> 3.3V divider     |
| YF-S201 VCC       | VIN (5V)           | Flow sensor power      |
| YF-S201 GND       | GND                | Common ground          |
| YF-S201 DATA/PULSE| GPIO 19 (D19)      | Interrupt pulse input  |
+-------------------+--------------------+------------------------+
```

### Voltage Divider on HC-SR04 Echo:

ESP32 GPIO pins are strictly 3.3V tolerant. The HC-SR04 echo pin outputs 5V logic:

```
HC-SR04 ECHO (5V) ---> [ 1kΩ Resistor ] ---> ESP32 GPIO 18
                                      |
                                [ 2kΩ Resistor ]
                                      |
                                     GND
```

_Output voltage to GPIO 18: $5V \times \frac{2k\Omega}{1k\Omega + 2k\Omega} \approx 3.33V$ (Safe for ESP32)._

---

## 3. Sensor Calibration & Formulae

### Water Level (%)

Given a total tank depth $H_{\text{total}}$ (e.g. 200 cm) and minimum sensor blind zone $H_{\text{blind}}$ (20 cm):
$$\text{Water Depth} = H_{\text{total}} - \text{Measured Distance (cm)}$$
$$\text{Water Level (\%)} = \text{clamp}\left(0, 100, \frac{\text{Water Depth}}{H_{\text{total}} - H_{\text{blind}}} \times 100\right)$$

### Flow Rate (L/min)

The YF-S201 sensor outputs pulses via a Hall effect turbine:
$$\text{Frequency } (Hz) = 7.5 \times \text{Flow Rate } (L/min)$$
$$\text{Flow Rate } (L/min) = \frac{\text{Pulses in interval}}{\text{Interval seconds} \times 7.5}$$

---

## 4. Telemetry Payload Contract

Every ESP32 unit authenticates via an HTTP header containing a pre-shared cryptographic device key:

- **Method**: `POST`
- **Endpoint**: `/api/v1/ingest`
- **Headers**:
  ```http
  Content-Type: application/json
  X-Device-Key: aq_key_tank-01_local_dev
  ```
- **Body JSON**:
  ```json
  {
    "deviceId": "tank-01",
    "waterLevel": 78.4,
    "flowRate": 2.1,
    "timestamp": "2026-10-09T00:30:00.000Z"
  }
  ```

### API Responses:

- `201 Created`: Telemetry processed, stored, and broadcast over Socket.IO.
- `202 Accepted`: Duplicate timestamp reading idempotent acknowledged.
- `401 Unauthorized`: Missing or invalid `X-Device-Key`.
- `422 Unprocessable Entity`: Schema validation failure (Zod validation).

---

## 5. Microcontroller Firmware Reference

Production Arduino / C++ firmware for ESP32 is included at:
[`tools/simulator/firmware/esp32_aquasave.ino`](file:///c:/Rainwater/tools/simulator/firmware/esp32_aquasave.ino)

### Configuration Defines:

```cpp
const char* WIFI_SSID     = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* BACKEND_URL   = "https://aquasave-api.onrender.com/api/v1/ingest";
const char* DEVICE_KEY    = "aq_key_tank-01_prod_secret";
const char* DEVICE_ID     = "tank-01";
const unsigned long SEND_INTERVAL_MS = 5000;
```

---

## 6. Verification and Diagnostics

1. **Local USB Serial Monitor**:
   Set baud rate to `115200`. Monitor NTP time synchronization, WiFi connectivity, and HTTP response status codes.
2. **Software Simulation Fallback**:
   If hardware is not connected, run the high-fidelity multi-cistern simulator:
   ```bash
   npm run dev:simulator
   ```
   Or simulate a plumbing anomaly / low water condition:
   ```bash
   SIMULATE_LEAK=true npm run dev:simulator
   ```
