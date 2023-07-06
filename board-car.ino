#include "FS.h"
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Servo.h>
#include <ArduinoJson.h>

// Replace with your network credentials
const char* ssid = "ESPControl";
const char* password = "0123456789";
String messageData = "";

int MotorState = 1;
int ServoState = 90;
const int motorD8 = 15;
const int motorD7 = 13;
const int motorD6 = 12;
const int motorD5 = 14;

Servo servo;

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void notifyClients() {
  ws.textAll(String(MotorState));
  ws.textAll(String(ServoState));
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;

  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
        StaticJsonDocument<256> json;
        DeserializationError err = deserializeJson(json, data);
        if (err) {
            Serial.print(F("deserializeJson() failed with code "));
            Serial.println(err.c_str());
            return;
        }
        
        const char* horizontalRotation = json["horizontal"];
        Serial.println(atoi(horizontalRotation));
        ServoState = atoi(horizontalRotation);

        const char* verticalDirection = json["vertical"];
        Serial.println(atoi(verticalDirection));
        MotorState = atoi(verticalDirection);

        const char* verticalSpeed = json["verticalSpeed"];
        Serial.println(atoi(verticalSpeed));

//        analogWrite(motorD6, atoi(verticalSpeed) );
        
    }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
    switch (type) {
      case WS_EVT_CONNECT:
        Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
        break;
      case WS_EVT_DISCONNECT:
        Serial.printf("WebSocket client #%u disconnected\n", client->id());
        break;
      case WS_EVT_DATA:
        handleWebSocketMessage(arg, data, len);
        break;
      case WS_EVT_PONG:
      case WS_EVT_ERROR:
        break;
  }
}

void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

String processor(const String& var){
  Serial.println(var);
  if(var == "STATE"){
    if (MotorState || ServoState){
      return "ON";
    }
    else{
      return "OFF";
    }
  }
  return String();
}

void setup(){
  Serial.begin(115200);

  pinMode(motorD8, OUTPUT);
  pinMode(motorD7, OUTPUT);
  pinMode(motorD6, OUTPUT);
  pinMode(motorD5, OUTPUT);

  servo.attach(D1);
  servo.write(90);
  
  
//  digitalWrite(ledPin, LOW);

  if(!SPIFFS.begin()){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
  
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid);
  
  // Print ESP Local IP Address
  Serial.println(WiFi.localIP());

  initWebSocket();

  // Route for root / web page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    // request->send_P(200, "text/html", index_html, processor);
    request->send(SPIFFS, "/index.html", String(), false, processor);
  });

  server.on("/main.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/main.js", "text/javascript");
  });
  server.on("/libs/jquery.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/libs/jquery.js", "text/javascript");
  });
  server.on("/libs/hammer.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/libs/hammer.js", "text/javascript");
  });
  server.on("/libs/createjs.min.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/libs/createjs.min.js", "text/javascript");
  });

  server.on("/main.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/main.css", "text/css");
  });

  // Start server
  server.begin();
}

void loop() {
  ws.cleanupClients();
  switch(MotorState) {
    case 0:
     digitalWrite(motorD8, LOW);
      digitalWrite(motorD7, HIGH);
      digitalWrite(motorD6, LOW);
      digitalWrite(motorD5, HIGH);
    break;
    case 1:
       digitalWrite(motorD8, HIGH);
      digitalWrite(motorD7, HIGH);
      digitalWrite(motorD6, HIGH);
      digitalWrite(motorD5, HIGH);
    break;  
    case 2:
      digitalWrite(motorD8, HIGH);
      digitalWrite(motorD7, LOW);
      digitalWrite(motorD6, HIGH);
      digitalWrite(motorD5, LOW);  
    break;
  }
  
  servo.write(ServoState);
  // switch(ServoState) {
  //   case 0:
  //    servo.write(0);
  //   break;
  //   case 1:
  //     servo.write(90);
  //   break;  
  //   case 2:
  //     servo.write(180);
  //   break;
  // }
  
}
