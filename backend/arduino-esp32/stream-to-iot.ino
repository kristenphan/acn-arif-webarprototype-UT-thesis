#include "secrets.h"
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "WiFi.h"
#include <NTPClient.h> 
#include <WiFiUdp.h>
 
// ESP32 pin number (36) which connects to AOUT pin of moisture sensor
#define AOUT_PIN 36

// Define IoT publish topic and port
#define AWS_IOT_PUBLISH_TOPIC "webar-iottopic-sensordata"
#define AWS_IOT_PORT 8883 // for MQTTS

// Define sensor id of the sensor the plant the sensor is associated with
#define SENSOR_ID 1

unsigned long timeEpoch;
int moistureValue;
int moisturePercentage;

// WiFiClientSecure.h is a base class that provides Client SSL to ESP32 microcontroller
// https://github.com/espressif/arduino-esp32/blob/master/libraries/WiFiClientSecure/src/WiFiClientSecure.h
WiFiClientSecure wifiSecureNetwork = WiFiClientSecure();

// Create a pubsub client which uses WiFi connection with SSL encryption
PubSubClient pubsubClient(wifiSecureNetwork);

// Define NTP Client which connects to NTP server via UDP to get time
WiFiUDP ntpUDP;
NTPClient ntpTimeClient(ntpUDP, "europe.pool.ntp.org");

// Connect to AWS IoT Core using connection credentials 
void connectAWSIoTCore() {
  // Set ESP32 as a WiFi station
  WiFi.mode(WIFI_STA); 

  // Connect ESP32 to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD); 
  Serial.println("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
 
  // Configure WiFiClientSecure to use the AWS IoT device credentials
  wifiSecureNetwork.setCACert(AWS_CERT_CA);
  wifiSecureNetwork.setCertificate(AWS_CERT_CRT);
  wifiSecureNetwork.setPrivateKey(AWS_CERT_PRIVATE);
 
  // Connect to the MQTT broker on the AWS endpoint using pubsub client
  pubsubClient.setServer(AWS_IOT_ENDPOINT, AWS_IOT_PORT);
 
  // Create a message handler
  pubsubClient.setCallback(messageHandler);
 
  Serial.println("Connecting to AWS IOT");
 
  while (!pubsubClient.connect(THINGNAME)) {
    Serial.print(".");
    delay(100);
  }
 
  if (!pubsubClient.connected()) {
    Serial.println("AWS IoT Timeout!");
    return;
  }
 
  Serial.println("AWS IoT Connected!");
}

// Publish a JSON message to a IoT publish topic  
void publishMessage() {
  StaticJsonDocument<200> doc;
  doc["sensorId"] = SENSOR_ID;
  doc["timeEpoch"] = timeEpoch;
  doc["sensorValue"] = moisturePercentage;
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer); // print to client
 
  pubsubClient.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer);
}
 
void messageHandler(char* topic, byte* payload, unsigned int length) {
  Serial.print("incoming: ");
  Serial.println(topic);
 
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload);
  const char* message = doc["message"];
  Serial.println(message);
}
 
void setup() {
  // Open serial port with data rate = 115200 bits per sec
  Serial.begin(115200);
  connectAWSIoTCore();

  // Initialize NTP Time Client
  ntpTimeClient.begin();

  // Get offset time in seconds to adjust for local timezone
  // Netherlands is UTC-4:00 Hrs: offset = -4 * 60 * 60 = -14400
  // NO NEED TO OFFSET. NOT SURE WHY.
  //ntpTimeClient.setTimeOffset(-14400);   
}
 
void loop() {
  // Get current date and time from NTP server
  ntpTimeClient.update();

  // Get epoch timestamp
  timeEpoch = ntpTimeClient.getEpochTime();

  // Get moisture sensor reading from sensor
  moistureValue = analogRead(AOUT_PIN); 
  
  // Calculate moisture percentage
  moisturePercentage = (4095 - moistureValue) * 100 / 4095; // 4095 as observed is max value for DRY  

  Serial.print("sensorId = ");
  Serial.println(SENSOR_ID);
  Serial.print("timeEpoch = ");
  Serial.println(timeEpoch);
  Serial.print("Moisture percentage (%): ");
  Serial.println(moisturePercentage);
  Serial.print("Moisture value: ");
  Serial.println(moistureValue);

  // Publish sensor reading to IoT Core every 5 seconds
  publishMessage();
  pubsubClient.loop(); // allow client to maintain its connection to IoT server
  delay(5000);
}