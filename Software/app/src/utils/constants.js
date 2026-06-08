// src/utils/constants.js

// BLE
export const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
export const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";
export const DEVICE_NAME = "ESP32_ADC";

// Conversão
export const TENSAO_MAX = 3.3;
export const ANGULO_MAX = 180;

// Flags e Comandos
export const FLAG_REQUEST = 0xB10E;
export const FLAG_ANSWER = 0xB10A;
export const FLAG_CALIBRATE = 0xB1FF;

export const CMD_START = 0x00;
export const CMD_STOP = 0x01;
export const CMD_CALIBRATE_ZERO = 0x02;

// Pacotes (bytes)
export const START_PACKET = [0xB1, 0x0E, 0x02, 0x00, 0xC1];
export const STOP_PACKET = [0xB1, 0x0E, 0x02, 0x01, 0xC2];
export const CALIBRATE_PACKET = [0xB1, 0xFF, 0x01, 0x02, 0xB3];