#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

#define ADC_PIN 34

#define START 0x00
#define STOP 0x01

const char *BT_NAME = "ESP32_ADC";
const char *BT_PIN  = "1234";

const uint16_t START_FLAG = 0xB10A;

bool coletando = false;

void setup() {
  Serial.begin(115200);

  pinMode(ADC_PIN, INPUT);

  analogReadResolution(12);

  analogSetPinAttenuation(ADC_PIN, ADC_11db);

  SerialBT.begin(BT_NAME);
  SerialBT.setPin(BT_PIN);

  Serial.println("Bluetooth iniciado");
}

void loop() {
  verificarComandoBluetooth();

  if (coletando) {
    enviarLeituraADC();
    delay(100);
  }
}

void verificarComandoBluetooth() {
  while (SerialBT.available() >= 3) {
    uint8_t b1 = SerialBT.read();
    uint8_t b2 = SerialBT.read();
    uint8_t len = SerialBT.read();
    uint8_t *cmd;
    uint8_t sum = 0;

    cmd = (uint8_t*)malloc(len);
    
    SerialBT.readBytes((char*)&cmd, len);

    uint16_t flag = ((uint16_t)b1 << 8) | b2;

    if (flag != START_FLAG) {
      return 1;
      // if (cmd == 0x00) {
      //   coletando = true;
      //   Serial.println("Coleta iniciada");
      // } 
      // else if (cmd == 0x01) {
      //   coletando = false;
      //   Serial.println("Coleta parada");
      // }
    }

    sum = b1 + b2 + len;

    for (int i= 0; i < (len -1); ++i)
      sum += cmd[i]

    if (sum != cmd[len - 1])
      return 1;


    switch (cmd[0])
    {
    case START:
      coletando = true;
      free(cmd)
      break;
    case STOP:
      coletando = false;
      free(cmd)
      break;
    }


  }
}

void enviarLeituraADC() {
  int adcRaw = analogRead(ADC_PIN);

  float tensao = adcRaw * (5.0 / 4095.0);

  uint16_t valor = (uint16_t)(tensao * 100.0);

  uint8_t byteAlto = (valor >> 8) & 0xFF;
    uint8_t byteBaixo = valor & 0xFF;
  
    SerialBT.write(byteAlto);
  SerialBT.write(byteBaixo);

}
