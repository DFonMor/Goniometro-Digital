// App.js - Versão Completa com BLE Real e Controles Separados + Picker + Perfil Expandido + Histórico Modal
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
import { Picker } from '@react-native-picker/picker';

import { Buffer } from 'buffer';

// IMPORTAÇÕES DOS SCRIPTS
import {
  SERVICE_UUID,
  CHARACTERISTIC_UUID,
  DEVICE_NAME,
  START_PACKET,
  STOP_PACKET,
  CALIBRATE_PACKET,
  MOVIMENTOS
} from './src/utils/constants';
import { parsePacket } from './src/utils/packetParser';
import ConversionService from './src/services/ConversionService';
import {
  carregarPacientes,
  criarPaciente,
  deletarPaciente,
  salvarMedicao as salvarMedicaoStorage,
  carregarMedicoes,
  salvarCalibracao,
  carregarCalibracao,
  deletarCalibracao,
  atualizarPaciente,
  atualizarMedicao,   // <-- NOVO: para editar anotação
  deletarMedicao       // <-- NOVO: para excluir medição
} from './src/services/StorageService';
import CalibrationModal from './src/components/CalibrationModal';

import { MockBLEService } from './src/services/MockBLEService';

import PacienteFormModal from './src/components/PacienteFormModal';
import HistoricoModal from './src/components/HistoricoModal'; // <-- NOVO

// Flag para usar mock ou BLE real
const USE_MOCK = false; // <-- AGORA true para testes

let manager = null;
const TAMANHO_FILTRO_MEDIANA = 12;

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
  const [modoMock, setModoMock] = useState(USE_MOCK);
  const [conectandoDispositivo, setConectandoDispositivo] = useState(false);
  const [dispositivoEncontrado, setDispositivoEncontrado] = useState(false);

  // ===== ESTADOS DOS MODAIS =====
  const [modalPacienteVisible, setModalPacienteVisible] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [modalHistoricoVisible, setModalHistoricoVisible] = useState(false); // <-- NOVO

  // ===== ESTADO PARA MOVIMENTO =====
  const [movimento, setMovimento] = useState(MOVIMENTOS[0].value);

  const deviceRef = useRef(null);
  const leiturasBufferRef = useRef([]);

  function calcularMediana(valores) {
    const ordenados = [...valores].sort((a, b) => a - b);
    const meio = Math.floor(ordenados.length / 2);

    if (ordenados.length % 2 === 0) {
      return (ordenados[meio - 1] + ordenados[meio]) / 2;
    }

    return ordenados[meio];
  }

  function filtrarTensaoPorMediana(tensaoRecebida) {
    leiturasBufferRef.current.push(tensaoRecebida);

    if (leiturasBufferRef.current.length > TAMANHO_FILTRO_MEDIANA) {
      leiturasBufferRef.current.shift();
    }

    return calcularMediana(leiturasBufferRef.current);
  }

  function limparFiltroMediana() {
    leiturasBufferRef.current = [];
  }

  // ===== CARREGAR DADOS AO INICIAR =====
  useEffect(() => {
    carregarDadosIniciais();
    
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
      ConversionService.setCalibrationZero(calibracao.tensaoZero);
      console.log(`Calibração carregada: 0° = ${calibracao.tensaoZero}V`);
    } else {
      ConversionService.resetCalibration();
    }
  }

  // ===== FUNÇÕES DE PACIENTE =====
  function abrirNovoPaciente() {
    setPacienteEditando(null);
    setModalPacienteVisible(true);
  }

  function abrirEdicaoPaciente() {
    if (!pacienteAtual) {
      Alert.alert('Aviso', 'Nenhum paciente selecionado');
      return;
    }
    setPacienteEditando(pacienteAtual);
    setModalPacienteVisible(true);
  }

  async function handleSalvarPaciente(dados, isEdit) {
    if (isEdit && pacienteEditando) {
      await atualizarPaciente(pacienteEditando.id, dados);
      const pacientesAtualizados = await carregarPacientes();
      setPacientes(pacientesAtualizados);
      await selecionarPaciente(pacienteEditando.id);
      Alert.alert('Sucesso', 'Paciente atualizado!');
    } else {
      const novoPaciente = await criarPaciente(dados.nome);
      if (dados.dataNascimento || dados.sexo || dados.ladoAfetado || dados.diagnostico || dados.prontuario || dados.telefone) {
        await atualizarPaciente(novoPaciente.id, dados);
      }
      const pacientesAtualizados = await carregarPacientes();
      setPacientes(pacientesAtualizados);
      await selecionarPaciente(novoPaciente.id);
      Alert.alert('Sucesso', `Paciente ${dados.nome} criado!`);
    }
    setModalPacienteVisible(false);
    setPacienteEditando(null);
  }

  async function criarNovoPaciente(nome) {
    const novoPaciente = await criarPaciente(nome);
    setPacientes([...pacientes, novoPaciente]);
    await selecionarPaciente(novoPaciente.id);
    Alert.alert('Sucesso', `Paciente ${nome} criado!`);
    setModalPacienteVisible(false);
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

  // ===== FUNÇÕES DE HISTÓRICO (para o modal) =====
  async function atualizarMedicaoHandler(medicaoId, novosDados) {
    if (!pacienteAtual) return;
    await atualizarMedicao(pacienteAtual.id, medicaoId, novosDados);
    // Recarregar histórico
    const medicoesAtualizadas = await carregarMedicoes(pacienteAtual.id);
    setHistorico(medicoesAtualizadas);
  }

  async function deletarMedicaoHandler(medicaoId) {
    if (!pacienteAtual) return;
    await deletarMedicao(pacienteAtual.id, medicaoId);
    const medicoesAtualizadas = await carregarMedicoes(pacienteAtual.id);
    setHistorico(medicoesAtualizadas);
  }

  // ===== FUNÇÃO PROCESSAR PACOTE =====
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
      const tensaoFiltrada = filtrarTensaoPorMediana(result.tensao);
      const anguloFiltrado = ConversionService.converterTensaoParaAngulo(tensaoFiltrada);

      setTensao(tensaoFiltrada.toFixed(2));
      setTensaoAtual(tensaoFiltrada);
      setAngulo(anguloFiltrado.toFixed(1));
      setUltimaLeitura(new Date().toLocaleTimeString());
      setPacotesPerdidos(0);
    }
  }

  // ===== FUNÇÕES DE CONEXÃO (MOCK) - INALTERADAS =====
  async function iniciarBLE_Mock() {
    setConectando(true);
    console.log("🔵 Mock: Iniciando simulação do Goniômetro...");
    
    setTimeout(() => {
      MockBLEService.iniciarSimulacao((dados) => {
        processarPacote(dados.value);
      });
      
      setConectado(true);
      setConectando(false);
      console.log("✅ Mock: Conectado ao Goniômetro (simulado)");
      MockBLEService.enviarStart();
    }, 1500);
  }

  async function enviarStartOnly_Mock() {
    if (!conectado) return;
    console.log("📤 Mock: START enviado");
    await MockBLEService.enviarStart();
  }

  async function enviarStopOnly_Mock() {
    if (!conectado) return;
    console.log("📤 Mock: STOP enviado (dados parados, conexão mantida)");
    await MockBLEService.enviarStop();
    Alert.alert('Sucesso', 'Coleta de dados interrompida. Conexão mantida.');
  }

  async function desconectarCompleto_Mock() {
    console.log("🔴 Mock: Desconectando completamente...");
    await MockBLEService.enviarStop();
    MockBLEService.pararSimulacao();
    limparFiltroMediana();
    setConectado(false);
    setAngulo("0.00");
    setTensao("0.00");
    console.log("✅ Mock: Desconectado");
    Alert.alert('Desconectado', 'Conexão BLE encerrada');
  }

  async function enviarCalibracaoBLE_Mock() {
    if (!conectado) {
      Alert.alert('Erro', 'Dispositivo não conectado');
      return;
    }
    console.log("📤 Mock: Comando de calibração enviado");
    await MockBLEService.enviarCalibracao();
  }

  // ===== FUNÇÕES DE CONEXÃO (BLE REAL) - INALTERADAS =====
  async function iniciarBLE_Real() {
    if (!manager) {
      Alert.alert('Erro', 'BLE Manager não inicializado');
      return;
    }
    
    setConectando(true);
    setConectandoDispositivo(false);
    setDispositivoEncontrado(false);
    
    console.log("Procurando Goniômetro Digital...");

    manager.stopDeviceScan();

    manager.startDeviceScan(null, null, async (error, device) => {
      if (error) {
        console.log("Erro no scan:", error);
        return;
      }

      if (conectandoDispositivo || dispositivoEncontrado) {
        console.log("Ignorando - já conectando/encontrado");
        return;
      }

      if (!device?.name) {
        console.log("Dispositivo sem nome ignorado");
        return;
      }

      console.log("Dispositivo encontrado:", device.name);

      if (device.name === DEVICE_NAME) {
        console.log("Match! Dispositivo alvo encontrado");
        
        setDispositivoEncontrado(true);
        setConectandoDispositivo(true);
        
        manager.stopDeviceScan();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await conectar_Real(device);
        
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
      
      try {
        await device.cancelConnection();
      } catch (e) {
        console.log("Sem conexão ativa para cancelar");
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const connectedDevice = await device.connect({ timeout: 15000 });
      console.log("Conexão estabelecida com sucesso!");
      
      const isConnected = await connectedDevice.isConnected();
      if (!isConnected) {
        throw new Error("Dispositivo desconectou imediatamente");
      }
      
      deviceRef.current = connectedDevice;
      setConectado(true);
      setConectando(false);
      setConectandoDispositivo(false);
      
      console.log("Conectado ao Goniômetro!");
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await connectedDevice.discoverAllServicesAndCharacteristics();
      console.log("Serviços descobertos");
      
      await enviarStartOnly_Real();

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

  // Apenas envia START (mantém conexão)
  async function enviarStartOnly_Real() {
    if (!deviceRef.current || !conectado) {
      console.log("Não é possível enviar START: dispositivo não conectado");
      return;
    }
    
    try {
      const bytes = Uint8Array.from(START_PACKET);
      const base64 = Buffer.from(bytes).toString('base64');
      await deviceRef.current.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );
      console.log("START enviado (retomando dados)");
    } catch (err) {
      console.log("Erro ao enviar START:", err);
    }
  }

  // Apenas envia STOP (mantém conexão)
  async function enviarStopOnly_Real() {
    if (!deviceRef.current || !conectado) {
      console.log("Não é possível enviar STOP: dispositivo não conectado");
      return;
    }
    
    try {
      const bytes = Uint8Array.from(STOP_PACKET);
      const base64 = Buffer.from(bytes).toString('base64');
      await deviceRef.current.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        base64
      );
      console.log("STOP enviado (dados parados, mas conexão mantida)");
      Alert.alert('Sucesso', 'Coleta de dados interrompida. Conexão mantida.');
    } catch (err) {
      console.log("Erro ao enviar STOP:", err);
      Alert.alert('Erro', 'Não foi possível enviar comando STOP');
    }
  }

  // Desconecta completamente (encerra conexão BLE)
  async function desconectarCompleto_Real() {
    if (deviceRef.current) {
      console.log("Desconectando completamente do dispositivo...");
      await enviarStopOnly_Real();
      await deviceRef.current.cancelConnection();
      deviceRef.current = null;
      limparFiltroMediana();
      setConectado(false);
      setAngulo("0.00");
      setTensao("0.00");
      console.log("Desconectado completamente");
      Alert.alert('Desconectado', 'Conexão BLE encerrada');
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

  // ===== FUNÇÕES GENÉRICAS =====
  function iniciarBLE() {
    if (modoMock) {
      iniciarBLE_Mock();
    } else {
      iniciarBLE_Real();
    }
  }

  function enviarStartOnly() {
    if (modoMock) {
      enviarStartOnly_Mock();
    } else {
      enviarStartOnly_Real();
    }
  }

  function enviarStopOnly() {
    if (modoMock) {
      enviarStopOnly_Mock();
    } else {
      enviarStopOnly_Real();
    }
  }

  function desconectarCompleto() {
    if (modoMock) {
      desconectarCompleto_Mock();
    } else {
      desconectarCompleto_Real();
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
    ConversionService.setCalibrationZero(tensaoAtual);
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
      movimento: movimento,
      timestamp: new Date().toISOString(),
      dataHora: new Date().toLocaleString('pt-BR')
    };

    await salvarMedicaoStorage(pacienteAtual.id, novaMedicao);
    setHistorico([novaMedicao, ...historico]);
    
    Alert.alert('Sucesso', 'Medição salva!');
  }

  // ===== RENDER =====
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Goniômetro Digital</Text>

      {/* Indicador de modo Mock */}
      {modoMock && (
        <View style={styles.mockIndicator}>
          <Text style={styles.mockText}>
            🧪 MODO SIMULAÇÃO
          </Text>
        </View>
      )}

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
          <View style={styles.pacienteActions}>
            <TouchableOpacity onPress={abrirNovoPaciente} style={styles.novoPacienteBtn}>
              <Text style={styles.novoPacienteText}>+ Novo</Text>
            </TouchableOpacity>
            {pacienteAtual && (
              <TouchableOpacity onPress={abrirEdicaoPaciente} style={styles.editarPacienteBtn}>
                <Text style={styles.novoPacienteText}>✏️ Editar</Text>
              </TouchableOpacity>
            )}
          </View>
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

      {/* Seletor de Movimento */}
      <View style={styles.pickerContainer}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerLabel}>Movimento:</Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </View>
        <Text style={styles.pickerSelected}>
          {MOVIMENTOS.find(m => m.value === movimento)?.label || movimento}
        </Text>
        <Picker
          selectedValue={movimento}
          onValueChange={(itemValue) => setMovimento(itemValue)}
          style={styles.pickerHidden}
          dropdownIconColor="transparent"
          mode="dropdown"
        >
          {MOVIMENTOS.map((item) => (
            <Picker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>

      {/* Botões de Controle */}
      {!conectado && !conectando && (
        <TouchableOpacity style={styles.conectarButton} onPress={iniciarBLE}>
          <Text style={styles.buttonText}>🔌 Conectar</Text>
        </TouchableOpacity>
      )}
      
      {conectado && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.startButton} onPress={enviarStartOnly}>
            <Text style={styles.buttonText}>▶ Iniciar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.stopButton} onPress={enviarStopOnly}>
            <Text style={styles.buttonText}>⏹ Parar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.salvarButton} onPress={salvarMedicao}>
            <Text style={styles.buttonText}>💾 Salvar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.calibrarButton} onPress={iniciarCalibracao}>
            <Text style={styles.buttonText}>🎯 Calibrar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.desconectarButton} onPress={desconectarCompleto}>
            <Text style={styles.buttonText}>🔌 Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botão para abrir Histórico (substitui a lista anterior) */}
      <TouchableOpacity
        style={styles.historicoButton}
        onPress={() => setModalHistoricoVisible(true)}
        disabled={!pacienteAtual}
      >
        <Text style={styles.historicoButtonText}>
          📋 Ver Histórico {pacienteAtual ? `(${historico.length})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Modal de Histórico */}
      <HistoricoModal
        visible={modalHistoricoVisible}
        onClose={() => setModalHistoricoVisible(false)}
        medicoes={historico}
        paciente={pacienteAtual}
        onAtualizarMedicao={atualizarMedicaoHandler}
        onDeletarMedicao={deletarMedicaoHandler}
      />

      {/* Modal de Calibração */}
      <CalibrationModal
        visible={modalCalibracaoVisible}
        onConfirm={confirmarCalibracao}
        onCancel={cancelarCalibracao}
        tensaoAtual={tensaoAtual.toFixed(3)}
      />
      
      {/* Modal de Paciente (criação/edição) */}
      <PacienteFormModal
        visible={modalPacienteVisible}
        onClose={() => {
          setModalPacienteVisible(false);
          setPacienteEditando(null);
        }}
        onSave={handleSalvarPaciente}
        paciente={pacienteEditando}
      />
    </View>
  );
}

// ===== ESTILOS =====
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
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8
  },
  pacienteNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1
  },
  pacienteActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  novoPacienteBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  editarPacienteBtn: {
    backgroundColor: '#f39c12',
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
  pickerContainer: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
    minHeight: 70,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingTop: 5,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  pickerArrow: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerSelected: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
  pickerHidden: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap'
  },
  conectarButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  startButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center'
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center'
  },
  salvarButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center'
  },
  calibrarButton: {
    backgroundColor: '#9b59b6',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center'
  },
  desconectarButton: {
    backgroundColor: '#e67e22',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  // ===== ESTILOS DO BOTÃO HISTÓRICO =====
  historicoButton: {
    backgroundColor: '#34495e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  historicoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Restante dos estilos (não utilizados diretamente, mantidos para compatibilidade)
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
  historicoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  historicoAngulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c'
  },
  historicoMovimento: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500'
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
