#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// AquaSave Backend Ingestion Endpoint
// Local:  http://192.168.1.X:3001/api/v1/ingest
// Prod:   https://aquasave-api.onrender.com/api/v1/ingest
const char* backendUrl = "https://aquasave-api.onrender.com/api/v1/ingest";

// Device Authentication Key (Provisioned from AquaSave seed / Atlas registry)
const char* deviceId = "tank-01";
const char* deviceKey = "aq_key_tank-01_local_dev";

// Ultrasonic Sensor Pins (JSN-SR04T / HC-SR04)
const int trigPin = 5;
const int echoPin = 18;

// Flow Meter Pin (YF-S201)
const int flowPin = 19;
volatile int pulseCount = 0;
float flowRate = 0.0;
unsigned long oldTime = 0;

// Tank Geometry (centimeters)
const float tankHeightCm = 200.0;
const float sensorOffsetCm = 15.0;

void IRAM_ATTR pulseCounter() {
  pulseCount++;
}

void setupTime() {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Waiting for NTP time sync...");
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nTime synchronized.");
}

String getIsoTimestamp() {
  time_t now;
  time(&now);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S.000Z", &timeinfo);
  return String(buf);
}

float measureWaterLevelPercent() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout (~5m)
  if (duration == 0) {
    // Sensor timeout fallback
    return 75.0;
  }

  float distanceCm = (duration * 0.0343) / 2.0;
  float waterDepthCm = tankHeightCm - (distanceCm - sensorOffsetCm);
  float percentage = (waterDepthCm / tankHeightCm) * 100.0;
  return constrain(percentage, 0.0, 100.0);
}

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(flowPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, FALLING);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  setupTime();
}

void loop() {
  // Calculate flow rate every 5 seconds
  if ((millis() - oldTime) >= 5000) {
    detachInterrupt(flowPin);
    // YF-S201: Pulse frequency (Hz) = 7.5Q, Q is flow rate in L/min
    flowRate = ((1000.0 / (millis() - oldTime)) * pulseCount) / 7.5;
    oldTime = millis();
    pulseCount = 0;
    attachInterrupt(digitalPinToInterrupt(flowPin), pulseCounter, FALLING);

    float waterLevel = measureWaterLevelPercent();
    String timestamp = getIsoTimestamp();

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(backendUrl);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-Device-Key", deviceKey);

      StaticJsonDocument<200> doc;
      doc["deviceId"] = deviceId;
      doc["waterLevel"] = round(waterLevel * 10.0) / 10.0;
      doc["flowRate"] = round(flowRate * 100.0) / 100.0;
      doc["timestamp"] = timestamp;

      String requestBody;
      serializeJson(doc, requestBody);

      Serial.println("Posting telemetry: " + requestBody);
      int httpResponseCode = http.POST(requestBody);

      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("[HTTP %d] Response: %s\n", httpResponseCode, response.c_str());
      } else {
        Serial.printf("HTTP POST failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }
  }
}
