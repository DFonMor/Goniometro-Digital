import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  Alert
} from 'react-native';

import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";

const manager = new BleManager();

export default function App() {

  const [angulo, setAngulo] = useState("0.00");
  const [tensao, setTensao] = useState("0.00");
  const [historico, setHistorico] = useState([]);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {

    iniciarBLE();

    return () => {
      manager.destroy();
    };

  }, []);

  async function iniciarBLE() {

    console.log("Procurando ESP32...");

    manager.startDeviceScan(null, null, async (error, device) => {

      if (error) {
        console.log(error);
        return;
      }

      if (device?.name === "ESP32_ADC") {

        console.log("ESP32 encontrado");

        manager.stopDeviceScan();

        conectar(device);
      }
    });
  }

  async function conectar(device) {

    try {

      const connectedDevice = await device.connect();

      console.log("Conectado ao ESP32");

      setConectado(true);

      await connectedDevice.discoverAllServicesAndCharacteristics();

      await enviarStart(connectedDevice);

      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {

          if (error) {
            console.log(error);
            return;
          }

          if (characteristic?.value) {
            processarPacote(characteristic.value);
          }
        }
      );

    } catch (err) {

      console.log(err);

      Alert.alert(
        "Erro BLE",
        "Não foi possível conectar ao ESP32."
      );
    }
  }

  async function enviarStart(device) {

    try {

      // START:
      // B1 0E 02 00 C1

      const bytes = Uint8Array.from([
        0xB1,
        0x0E,
        0x02,
        0x00,
        0xC1
      ]);

      const base64 = Buffer.from(bytes).toString('base64');

      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );

      console.log("START enviado");

    } catch (err) {

      console.log(err);
    }
  }

  function processarPacote(base64Value) {

    const buffer = Buffer.from(base64Value, 'base64');

    const bytes = Uint8Array.from(buffer);

    // Estrutura esperada:
    // [B1][0A][03][HIGH][LOW][CHECKSUM]

    if (bytes.length < 6) {
      console.log("Pacote incompleto");
      return;
    }

    const flag1 = bytes[0];
    const flag2 = bytes[1];
    const len = bytes[2];
    const high = bytes[3];
    const low = bytes[4];
    const checksum = bytes[5];

    // Verifica FLAG
    if (flag1 !== 0xB1 || flag2 !== 0x0A) {

      console.log("FLAG inválida");
      return;
    }

    // Verifica checksum
    let soma = 0;

    for (let i = 0; i < 5; i++) {
      soma += bytes[i];
    }

    soma = soma & 0xFF;

    if (soma !== checksum) {

      console.log("Checksum inválido");
      return;
    }

    // Junta HIGH + LOW
    const valor = (high << 8) | low;

    // Converte para tensão
    const tensaoRecebida = valor / 100.0;

    setTensao(tensaoRecebida.toFixed(2));

    // ==========================================
    // Conversão TEMPORÁRIA tensão -> ângulo
    // ==========================================

    // Ajustar futuramente
    const anguloConvertido = tensaoRecebida * 10;

    setAngulo(anguloConvertido.toFixed(2));
  }

  function salvarMedicao() {

    const novaMedicao = {

      id: Date.now().toString(),

      valor: angulo,

      tensao: tensao,

      data: new Date().toLocaleTimeString()
    };

    setHistorico((prev) => [novaMedicao, ...prev]);
  }

  return (

    <View style={styles.container}>

      <Text style={styles.titulo}>
        Goniômetro Digital
      </Text>

      <Text style={styles.status}>
        Status BLE: {conectado ? "Conectado" : "Desconectado"}
      </Text>

      <Text style={styles.label}>
        Tensão:
      </Text>

      <Text style={styles.valor}>
        {tensao} V
      </Text>

      <Text style={styles.label}>
        Ângulo:
      </Text>

      <Text style={styles.angulo}>
        {angulo}°
      </Text>

      <Button
        title="Salvar medição"
        onPress={salvarMedicao}
      />

      <Text style={styles.subtitulo}>
        Histórico
      </Text>

      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

          <Text style={styles.item}>
            {item.valor}° | {item.tensao} V | {item.data}
          </Text>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    marginTop: 40
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20
  },

  status: {
    fontSize: 18,
    marginBottom: 20
  },

  label: {
    fontSize: 18,
    marginTop: 10
  },

  valor: {
    fontSize: 28,
    marginBottom: 10
  },

  angulo: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20
  },

  subtitulo: {
    fontSize: 22,
    marginTop: 30,
    marginBottom: 10
  },

  item: {
    fontSize: 16,
    marginBottom: 8
  }
});