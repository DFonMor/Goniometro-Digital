/*
====================================================
Formato das mensagens BLE
====================================================

Estrutura geral:

[FLAG_1][FLAG_2][LEN][DATA ...][CHECKSUM]

Onde:
- FLAG_1 e FLAG_2 identificam o tipo da mensagem
- LEN indica quantidade de bytes em DATA + CHECKSUM
- CHECKSUM = soma simples dos bytes anteriores

----------------------------------------------------
Comandos recebidos pelo ESP32
----------------------------------------------------

START:
B1 0E 02 00 C1

STOP:
B1 0E 02 01 C2

----------------------------------------------------
Resposta enviada pelo ESP32
----------------------------------------------------

B1 0A 03 HIGH LOW CHECKSUM

HIGH + LOW:
valor da tensão em centésimos de volt

Exemplo:
01 2C = 300 -> 3.00V

====================================================
*/

#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>



#define ADC_PIN 34

#define FLAG_REQUEST 0xB10E
#define FLAG_ANSWER  0xB10A

#define START 0x00
#define STOP  0x01

typedef struct {
  uint8_t flag_1 = 0xB1;
  uint8_t flag_2 = 0x0A;
  uint8_t len = 3;
  uint8_t high;
  uint8_t low;
  uint8_t sum = 0;
} Packet;

const char *BT_NAME = "ESP32_ADC";

#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "abcd1234-5678-90ab-cdef-1234567890ab"

float volts = 3.3;
int resolution = 2 << 12;

bool coletando = false;
bool deviceConnected = false;

BLECharacteristic *pCharacteristic;

void enviarLeituraADC();
void verificarComandoBluetooth(uint8_t *data, size_t size);

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    Serial.println("BLE conectado");
  }

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    coletando = false;
    Serial.println("BLE desconectado");

    BLEDevice::startAdvertising();
  }
};

class CharacteristicCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) {
    std::string value = characteristic->getValue();

    if (value.length() > 0) {
      verificarComandoBluetooth((uint8_t *)value.data(), value.length());
    }
  }
};

void setup() {
  Serial.begin(115200);

  pinMode(ADC_PIN, INPUT);

  analogReadResolution(12);
  analogSetPinAttenuation(ADC_PIN, ADC_11db);

  BLEDevice::init(BT_NAME);

  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ   |
    BLECharacteristic::PROPERTY_WRITE  |
    BLECharacteristic::PROPERTY_NOTIFY
  );

  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic->setCallbacks(new CharacteristicCallbacks());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);

  BLEDevice::startAdvertising();

  Serial.println("BLE iniciado");
}

void loop() {
  if (coletando) {
    enviarLeituraADC();
  }
  delay(100);
}

void verificarComandoBluetooth(uint8_t *data, size_t size) {
  if (size < 3) return;

  Serial.println("recebeu mensagem");

  uint8_t b1 = data[0];
  uint8_t b2 = data[1];
  uint8_t len = data[2];

  if (size < 3 + len) return;

  uint8_t *cmd = (uint8_t *)malloc(len);
  if (cmd == NULL) return;

  memcpy(cmd, &data[3], len);

  uint16_t flag = ((uint16_t)b1 << 8) | b2;

  if (flag != FLAG_REQUEST) {
    Serial.println("Flag errada");
    free(cmd);
    return;
  }

  uint8_t sum = b1 + b2 + len;

  for (int i = 0; i < (len - 1); ++i) {
    sum += cmd[i];
  }

  if (sum != cmd[len - 1]) {
    Serial.println("sum errado");
    free(cmd);
    return;
  }

  Serial.println("verificando comando");

  switch (cmd[0]) {
    case START:
      coletando = true;
      Serial.println("START");
      break;

    case STOP:
      coletando = false;
      Serial.println("STOP");
      break;
  }

  free(cmd);
}

void enviarLeituraADC() {
  if (!deviceConnected) return;

  Packet pacote;

  int adcRaw = analogRead(ADC_PIN);

  float tensao = adcRaw * (volts / resolution);

  uint16_t valor = (uint16_t)(tensao * 100.0);

  pacote.high = (valor >> 8) & 0xFF;
  pacote.low = valor & 0xFF;

  pacote.sum += pacote.flag_1 + pacote.flag_2 + pacote.len + pacote.high + pacote.low;

  pCharacteristic->setValue((uint8_t *)&pacote, sizeof(Packet));
  pCharacteristic->notify();
}
