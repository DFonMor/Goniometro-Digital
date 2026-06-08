// App.js - Versão com Mock BLE (para testes sem hardware)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  Switch
} from 'react-native';

import { Buffer } from 'buffer';

// IMPORTAÇÕES DOS SCRIPTS
import {
  SERVICE_UUID,
  CHARACTERISTIC_UUID,
  DEVICE_NAME,
  START_PACKET,
  STOP_PACKET,
  CALIBRATE_PACKET
} from './src/utils/constants';
import { parsePacket } from './src/utils/packetParser';
import { converterTensaoParaAngulo } from './src/services/ConversionService';
import {
  carregarPacientes,
  criarPaciente,
  deletarPaciente,
  salvarMedicao as salvarMedicaoStorage,
  carregarMedicoes,
  salvarCalibracao,
  carregarCalibracao,
  deletarCalibracao
} from './src/services/StorageService';
import CalibrationModal from './src/components/CalibrationModal';

import { MockBLEService } from './src/services/MockBLEService';

import NovoPacienteModal from './src/components/NovoPacienteModal';

// Flag para usar mock ou BLE real
const USE_MOCK = false; //  Mude para false para usar BLE real

let manager = null;

// Só importa o BLE real se não estiver usando mock
if (!USE_MOCK) {
  const { BleManager } = require('react-native-ble-plx');
  manager = new BleManager();
}

export default function App() {

  // ===== ESTADOS EXISTENTES =====
  const [angulo, setAngulo] = useState("0.00");
  const [tensao, setTensao] = useState("0.00");
  const [historico, setHistorico] = useState([]);
  const [conectado, setConectado] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [pacotesPerdidos, setPacotesPerdidos] = useState(0);
  const [ultimaLeitura, setUltimaLeitura] = useState(null);

  // ===== NOVOS ESTADOS =====
  const [pacientes, setPacientes] = useState([]);
  const [pacienteAtual, setPacienteAtual] = useState(null);
  const [modalCalibracaoVisible, setModalCalibracaoVisible] = useState(false);
  const [tensaoAtual, setTensaoAtual] = useState(0);
  const [modoMock, setModoMock] = useState(USE_MOCK); // Estado para controle UI
  const [modalNovoPacienteVisible, setModalNovoPacienteVisible] = useState(false);
  const [conectandoDispositivo, setConectandoDispositivo] = useState(false);
  const [dispositivoEncontrado, setDispositivoEncontrado] = useState(false);

  const deviceRef = useRef(null);

  // ===== CARREGAR DADOS AO INICIAR =====
  useEffect(() => {
    carregarDadosIniciais();
    
    // Cleanup ao desmontar
    return () => {
      if (modoMock && MockBLEService.estaSimulando()) {
        MockBLEService.pararSimulacao();
      }
    };
  }, []);

  async function carregarDadosIniciais() {
    const pacientesSalvos = await carregarPacientes();
    setPacientes(pacientesSalvos);
    
    if (pacientesSalvos.length > 0) {
      const ultimoPaciente = pacientesSalvos[pacientesSalvos.length - 1];
      await selecionarPaciente(ultimoPaciente.id);
    }
  }

  async function selecionarPaciente(id) {
    const paciente = pacientes.find(p => p.id === id);
    if (!paciente) return;
    
    setPacienteAtual(paciente);
    
    const medicoes = await carregarMedicoes(id);
    setHistorico(medicoes);
    
    const calibracao = await carregarCalibracao(id);
    if (calibracao) {
      console.log(`Calibração carregada: 0° = ${calibracao.tensaoZero}V`);
    }
  }

  async function criarNovoPaciente(nome) {
    const novoPaciente = await criarPaciente(nome);
    setPacientes([...pacientes, novoPaciente]);
    await selecionarPaciente(novoPaciente.id);
    Alert.alert('Sucesso', `Paciente ${nome} criado!`);
    setModalNovoPacienteVisible(false); // Fecha o modal
  }

  async function excluirPaciente(id) {
    Alert.alert(
      'Confirmar',
      'Tem certeza que deseja excluir este paciente e todas as suas medições?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deletarPaciente(id);
            const pacientesRestantes = await carregarPacientes();
            setPacientes(pacientesRestantes);
            
            if (pacientesRestantes.length > 0) {
              await selecionarPaciente(pacientesRestantes[0].id);
            } else {
              setPacienteAtual(null);
              setHistorico([]);
            }
            Alert.alert('Sucesso', 'Paciente excluído');
          }
        }
      ]
    );
  }

  // ===== FUNÇÃO PROCESSAR PACOTE (mesma para mock e BLE real) =====
  function processarPacote(base64Value) {
    const result = parsePacket(base64Value);
    
    if (!result.success) {
      if (result.error === 'incomplete' || result.error === 'invalid_checksum') {
        setPacotesPerdidos(prev => prev + 1);
      }
      return;
    }
    
    if (result.type === 'calibration') {
      if (result.status === 0x01) {
        Alert.alert('Sucesso', 'Calibração realizada com sucesso!');
      }
      return;
    }
    
    if (result.type === 'data') {
      setTensao(result.tensao.toFixed(2));
      setTensaoAtual(result.tensao);
      setAngulo(result.angulo.toFixed(1));
      setUltimaLeitura(new Date().toLocaleTimeString());
      setPacotesPerdidos(0);
    }
  }

  // ===== FUNÇÕES DE CONEXÃO (MOCK) =====
  async function iniciarBLE_Mock() {
    setConectando(true);
    console.log("🔵 Mock: Iniciando simulação do Goniômetro...");
    
    // Pequeno delay para simular conexão
    setTimeout(() => {
      // Inicia simulação
      MockBLEService.iniciarSimulacao((dados) => {
        processarPacote(dados.value);
      });
      
      setConectado(true);
      setConectando(false);
      console.log("✅ Mock: Conectado ao Goniômetro (simulado)");
      
      // Simula envio de START
      MockBLEService.enviarStart();
    }, 1500);
  }

  async function desconectarBLE_Mock() {
    console.log("🔴 Mock: Desconectando...");
    MockBLEService.pararSimulacao();
    setConectado(false);
    setAngulo("0.00");
    setTensao("0.00");
    console.log("✅ Mock: Desconectado");
  }

  async function enviarCalibracaoBLE_Mock() {
    if (!conectado) {
      Alert.alert('Erro', 'Dispositivo não conectado');
      return;
    }
    console.log("📤 Mock: Comando de calibração enviado");
    await MockBLEService.enviarCalibracao();
  }

  // ===== FUNÇÕES DE CONEXÃO (BLE REAL) =====
  async function iniciarBLE_Real() {
    if (!manager) {
      Alert.alert('Erro', 'BLE Manager não inicializado');
      return;
    }
    
    setConectando(true);
    setConectandoDispositivo(false); // Reset
    setDispositivoEncontrado(false);
    
    console.log("Procurando Goniômetro Digital...");

    // Para o scan anterior se existir
    manager.stopDeviceScan();

    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.log("Erro no scan:", error);
        return;
      }

      // Ignora se já estamos conectando a um dispositivo
      if (conectandoDispositivo || dispositivoEncontrado) {
        console.log("Ignorando - já conectando/encontrado");
        return;
      }

      // Ignora dispositivos sem nome
      if (!device?.name) {
        console.log("Dispositivo sem nome ignorado");
        return;
      }

      console.log("Dispositivo encontrado:", device.name);

      if (device.name === DEVICE_NAME) {
        console.log("Match! Dispositivo alvo encontrado");
        
        // Marca que já encontramos e estamos conectando
        setDispositivoEncontrado(true);
        setConectandoDispositivo(true);
        
        // Para o scan IMEDIATAMENTE
        manager.stopDeviceScan();
        
        // Aguarda um pouco antes de tentar conectar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await conectar_Real(device);
        
        // Libera os flags após tentativa
        setConectandoDispositivo(false);
      }
    });

    setTimeout(() => {
      if (!conectado && conectando) {
        manager.stopDeviceScan();
        setConectando(false);
        setConectandoDispositivo(false);
        setDispositivoEncontrado(false);
        Alert.alert('Erro', 'Dispositivo não encontrado. Verifique o BLE.');
      }
    }, 15000);
  }

  async function conectar_Real(device) {
    try {
      const deviceId = device.id;
      console.log(`Tentando conectar ao dispositivo: ${deviceId}`);
      
      // Garante que não há conexão pendente
      try {
        await device.cancelConnection();
      } catch (e) {
        // Ignora erro se não estava conectado
        console.log("Sem conexão ativa para cancelar");
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const connectedDevice = await device.connect({ timeout: 15000 });
      console.log("Conexão estabelecida com sucesso!");
      
      // Verifica conexão
      const isConnected = await connectedDevice.isConnected();
      if (!isConnected) {
        throw new Error("Dispositivo desconectou imediatamente");
      }
      
      deviceRef.current = connectedDevice;
      setConectado(true);
      setConectando(false);
      setConectandoDispositivo(false);
      
      console.log("Conectado ao Goniômetro!");
      
      // Aguarda um pouco antes de descobrir serviços
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("Serviços descobertos");
      
      await enviarStart_Real(connectedDevice);

      // Monitora características
      connectedDevice.monitorCharacteristicForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.log("Erro no monitoramento:", error);
            return;
          }
          if (characteristic?.value) {
            processarPacote(characteristic.value);
          }
        }
      );

    } catch (err) {
      console.log("Erro detalhado na conexão:", err);
      setConectando(false);
      setConectandoDispositivo(false);
      setDispositivoEncontrado(false);
      Alert.alert("Erro BLE", `Erro: ${err.message || "Não foi possível conectar"}`);
    }
  }

  async function desconectarBLE_Real() {
    if (deviceRef.current) {
      await enviarStop_Real(deviceRef.current);
      await deviceRef.current.cancelConnection();
      deviceRef.current = null;
      setConectado(false);
      console.log("Desconectado");
    }
  }

  async function enviarStart_Real(device) {
    try {
      const bytes = Uint8Array.from(START_PACKET);
      const base64 = Buffer.from(bytes).toString('base64');
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );
      console.log("START enviado");
    } catch (err) {
      console.log("Erro ao enviar START:", err);
    }
  }

  async function enviarStop_Real(device) {
    try {
      const bytes = Uint8Array.from(STOP_PACKET);
      const base64 = Buffer.from(bytes).toString('base64');
      await device.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );
      console.log("STOP enviado");
    } catch (err) {
      console.log("Erro ao enviar STOP:", err);
    }
  }

  async function enviarCalibracaoBLE_Real() {
    if (!deviceRef.current || !conectado) {
      Alert.alert('Erro', 'Dispositivo não conectado');
      return;
    }

    try {
      const bytes = Uint8Array.from(CALIBRATE_PACKET);
      const base64 = Buffer.from(bytes).toString('base64');
      await deviceRef.current.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );
      console.log("Comando de calibração enviado ao ESP32");
    } catch (err) {
      console.log("Erro na calibração BLE:", err);
    }
  }

  // ===== FUNÇÕES GENÉRICAS (chamam mock ou real) =====
  function iniciarBLE() {
    if (modoMock) {
      iniciarBLE_Mock();
    } else {
      iniciarBLE_Real();
    }
  }

  function desconectarBLE() {
    if (modoMock) {
      desconectarBLE_Mock();
    } else {
      desconectarBLE_Real();
    }
  }

  function enviarCalibracaoBLE() {
    if (modoMock) {
      enviarCalibracaoBLE_Mock();
    } else {
      enviarCalibracaoBLE_Real();
    }
  }

  // ===== CALIBRAÇÃO (APP) =====
  function iniciarCalibracao() {
    if (!pacienteAtual) {
      Alert.alert('Aviso', 'Selecione ou crie um paciente primeiro');
      return;
    }
    setModalCalibracaoVisible(true);
  }

  async function confirmarCalibracao() {
    if (!pacienteAtual) return;
    
    await salvarCalibracao(pacienteAtual.id, tensaoAtual);
    setModalCalibracaoVisible(false);
    Alert.alert('Sucesso', `Calibração definida: 0° = ${tensaoAtual.toFixed(3)}V`);
  }

  function cancelarCalibracao() {
    setModalCalibracaoVisible(false);
  }

  // ===== PERSISTÊNCIA =====
  async function salvarMedicao() {
    if (!pacienteAtual) {
      Alert.alert('Aviso', 'Selecione ou crie um paciente primeiro');
      return;
    }

    const novaMedicao = {
      id: Date.now().toString(),
      angulo: angulo,
      tensao: tensao,
      timestamp: new Date().toISOString(),
      dataHora: new Date().toLocaleString('pt-BR')
    };

    await salvarMedicaoStorage(pacienteAtual.id, novaMedicao);
    setHistorico([novaMedicao, ...historico]);
    
    Alert.alert('Sucesso', 'Medição salva!');
  }

  // ===== NOVO PACIENTE =====
function promptNovoPaciente() {
  setModalNovoPacienteVisible(true);
}

  // ===== RENDER =====
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Goniômetro Digital</Text>

      {/* Indicador de modo Mock */}
      <View style={styles.mockIndicator}>
        <Text style={styles.mockText}>
          🧪 MODO {modoMock ? 'SIMULAÇÃO' : 'BLE REAL'}
        </Text>
        {!modoMock && (
          <Text style={styles.mockWarning}>
            (requer ESP32 conectado)
          </Text>
        )}
      </View>

      {/* Status BLE */}
      <Text style={styles.status}>
        BLE: {conectado ? "🟢 Conectado" : conectando ? "🟡 Conectando" : "🔴 Desconectado"}
      </Text>
      
      {pacotesPerdidos > 0 && (
        <Text style={styles.warning}>⚠️ {pacotesPerdidos} pacotes perdidos</Text>
      )}

      {/* Paciente Atual */}
      <View style={styles.pacienteSection}>
        <Text style={styles.pacienteLabel}>Paciente:</Text>
        <View style={styles.pacienteRow}>
          <Text style={styles.pacienteNome}>
            {pacienteAtual ? pacienteAtual.nome : "Nenhum"}
          </Text>
          <TouchableOpacity onPress={promptNovoPaciente} style={styles.novoPacienteBtn}>
            <Text style={styles.novoPacienteText}>+ Novo</Text>
          </TouchableOpacity>
        </View>
        
        {pacientes.length > 0 && (
          <FlatList
            horizontal
            data={pacientes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.pacienteItem,
                  pacienteAtual?.id === item.id && styles.pacienteAtivo
                ]}
                onPress={() => selecionarPaciente(item.id)}
                onLongPress={() => excluirPaciente(item.id)}
              >
                <Text style={styles.pacienteItemText}>{item.nome}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Medições */}
      <View style={styles.medicoesContainer}>
        <Text style={styles.label}>Tensão:</Text>
        <Text style={styles.valor}>{tensao} V</Text>
        
        <Text style={styles.label}>Ângulo:</Text>
        <Text style={styles.angulo}>{angulo}°</Text>
        
        {ultimaLeitura && (
          <Text style={styles.ultimaLeitura}>Última: {ultimaLeitura}</Text>
        )}
      </View>

      {/* Botões de Controle */}
      {!conectado && !conectando && (
        <TouchableOpacity style={styles.conectarButton} onPress={iniciarBLE}>
          <Text style={styles.buttonText}>Conectar</Text>
        </TouchableOpacity>
      )}
      
      {conectado && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.salvarButton} onPress={salvarMedicao}>
            <Text style={styles.buttonText}>💾 Salvar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.calibrarButton} onPress={iniciarCalibracao}>
            <Text style={styles.buttonText}>🎯 Calibrar 0°</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.stopButton} onPress={desconectarBLE}>
            <Text style={styles.buttonText}>⏹ Parar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Histórico */}
      <Text style={styles.subtitulo}>
        Histórico {pacienteAtual ? `- ${pacienteAtual.nome}` : ''}
      </Text>
      
      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historicoItem}>
            <Text style={styles.historicoAngulo}>{item.angulo}°</Text>
            <Text style={styles.historicoInfo}>
              {item.tensao} V | {item.dataHora}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma medição salva</Text>
        }
      />

      {/* Modal de Calibração */}
      <CalibrationModal
        visible={modalCalibracaoVisible}
        onConfirm={confirmarCalibracao}
        onCancel={cancelarCalibracao}
        tensaoAtual={tensaoAtual.toFixed(3)}
      />
      {/* NOVO: Modal de Novo Paciente */}
      <NovoPacienteModal
        visible={modalNovoPacienteVisible}
        onConfirm={criarNovoPaciente}
        onCancel={() => setModalNovoPacienteVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2c3e50'
  },
  mockIndicator: {
    backgroundColor: '#f39c12',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center'
  },
  mockText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff'
  },
  mockWarning: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2
  },
  status: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center'
  },
  warning: {
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 10
  },
  pacienteSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15
  },
  pacienteLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  pacienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  pacienteNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  novoPacienteBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  novoPacienteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  pacienteItem: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 5
  },
  pacienteAtivo: {
    backgroundColor: '#3498db'
  },
  pacienteItemText: {
    fontSize: 12,
    color: '#2c3e50'
  },
  medicoesContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2
  },
  label: {
    fontSize: 18,
    color: '#7f8c8d'
  },
  valor: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  angulo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5
  },
  ultimaLeitura: {
    fontSize: 12,
    color: '#95a5a6'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  conectarButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  salvarButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  calibrarButton: {
    backgroundColor: '#9b59b6',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  subtitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50'
  },
  historicoItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  historicoAngulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c'
  },
  historicoInfo: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  emptyText: {
    textAlign: 'center',
    color: '#95a5a6',
    marginTop: 20
  }
});