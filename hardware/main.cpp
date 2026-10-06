#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

const char* ssid = "PTD";
const char* password = "12112005";

const char* mqtt_user = "dung064";
const char* mqtt_pass = "dung123";

// const char* ssid = "Wokwi-GUEST";
// const char* password = "";

// const char* ssid = "Tang2";
// const char* password = "11111111";

// const char* mqtt_server = "broker.emqx.io";
const char* mqtt_server = "10.179.205.92";

const int mqtt_port = 1883;
const char* topic_sensor  = "home/sensors/data";    
const char* topic_control = "home/devices/control";  
const char* topic_status  = "home/devices/status";  
#define DHTPIN 4        
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
#define LDR_PIN 34      
#define LED1_PIN 18      
#define LED2_PIN 19      
#define LED3_PIN 21    

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsgTime = 0;
const int SENSOR_READ_INTERVAL = 2000;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Đang kết nối WiFi tới: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Đã kết nối WiFi thành công!");
  Serial.print("Địa chỉ IP: ");
  Serial.println(WiFi.localIP());
}
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Có tin nhắn đến từ topic [");
  Serial.print(topic);
  Serial.print("]: ");
  String messageTemp;
  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  Serial.println(messageTemp);
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, messageTemp);
  if (error) {
    Serial.print("Lỗi đọc JSON: ");
    Serial.println(error.c_str());
    return;
  }
  const char* device_id = doc["device_id"];
  const char* action = doc["action"];
  String strAction = String(action);
  strAction.toUpperCase();
  bool isSuccess = false;
  String currentStatus = "";
  if (String(device_id) == "led_1") {
    if (strAction == "ON") {
      digitalWrite(LED1_PIN, HIGH);
      currentStatus = "ON";
      isSuccess = true;
    } else if (strAction == "OFF") {
      digitalWrite(LED1_PIN, LOW);
      currentStatus = "OFF";
      isSuccess = true;
    }
  } else if (String(device_id) == "led_2") {
    if (strAction == "ON") {
      digitalWrite(LED2_PIN, HIGH);
      currentStatus = "ON";
      isSuccess = true;
    } else if (strAction == "OFF") {
      digitalWrite(LED2_PIN, LOW);
      currentStatus = "OFF";
      isSuccess = true;
    }
  } else if (String(device_id) == "led_3") {
    if (strAction == "ON") {
      digitalWrite(LED3_PIN, HIGH);
      currentStatus = "ON";
      isSuccess = true;
    } else if (strAction == "OFF") {
      digitalWrite(LED3_PIN, LOW);
      currentStatus = "OFF";
      isSuccess = true;
    }
  }
  if (isSuccess) {
    StaticJsonDocument<200> responseDoc;
    responseDoc["device_id"] = device_id;
    responseDoc["status"] = currentStatus;
    responseDoc["result"] = "success";
   
    char responseBuffer[200];
    serializeJson(responseDoc, responseBuffer);
   
    client.publish(topic_status, responseBuffer);
    Serial.println("Đã gửi phản hồi: " + String(responseBuffer));
  } else {
    Serial.println("Lỗi: Không tìm thấy thiết bị hoặc action không hợp lệ.");
  }
}
void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang cố gắng kết nối MQTT Broker...");
    String clientId = "ESP32Client-";
    clientId += String(random(0, 0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("Đã kết nối MQTT thành công!");
      client.subscribe(topic_control);
      Serial.println("Đã Subscribe topic: " + String(topic_control));
    } else {
      Serial.print("Thất bại, mã lỗi (rc)=");
      Serial.print(client.state());
      Serial.println(". Thử lại sau 5 giây...");
      delay(5000);
    }
  }
}
void setup() {
  Serial.begin(115200);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(LED3_PIN, LOW);
  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}
void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsgTime > SENSOR_READ_INTERVAL) {
    lastMsgTime = now;

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int lightValueRaw = analogRead(LDR_PIN);

    float voltage = lightValueRaw / 4095.0 * 3.3;
    float lux = 0.0;

    if (voltage < 3.29 && voltage > 0.01) {
      float resistance = 2000.0 * voltage / (1.0 - voltage / 3.3);
      lux = pow(50.0 * 1e3 * pow(10, 0.7) / resistance, (1.0 / 0.7));
    } else if (voltage >= 3.29) {
      lux = 0.1; 
    } else {
      lux = 100000.0; 
    }

    if (isnan(h) || isnan(t)) {
      Serial.println("Lỗi: Không thể đọc dữ liệu từ cảm biến DHT!");
      return;
    }

    Serial.print("Nhiệt độ: "); Serial.print(t);
    Serial.print("°C | Độ ẩm: "); Serial.print(h);
    Serial.print("% | Ánh sáng: "); Serial.print(lux, 1); Serial.println(" Lux");

    StaticJsonDocument<200> doc;
    doc["temperature"] = t;
    doc["humidity"] = h;
    doc["light"] = round(lux * 10) / 10.0;

    char msgBuffer[200];
    serializeJson(doc, msgBuffer);

    client.publish(topic_sensor, msgBuffer);
    Serial.println("Đã gửi MQTT: " + String(msgBuffer));
    Serial.println("-----------------------------------------");
  }
}
