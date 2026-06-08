// src/services/MockBLEService.js
// Serviço para simular o ESP32 sem hardware real

let intervalId = null;
let listeners = [];

// Configurações do mock
let anguloAtual = 0;
let direcao = 1; // 1 = aumentando, -1 = diminuindo
let tensaoBase = 1.65; // tensão central (equivalente a 90°)
let amplitude = 1.65; // amplitude de variação (±1.65V = 0 a 3.3V)

// Função para gerar dados simulados (variação senoidal)
function gerarDadosSimulados() {
  // Simula movimento de vai-e-vem (como um pêndulo)
  anguloAtual += direcao * 5; // incrementa 5 graus por ciclo
  
  if (anguloAtual >= 180) {
    anguloAtual = 180;
    direcao = -1;
  } else if (anguloAtual <= 0) {
    anguloAtual = 0;
    direcao = 1;
  }
  
  // Converte ângulo para tensão (0-3.3V)
  const tensao = (anguloAtual / 180) * 3.3;
  
  return {
    angulo: anguloAtual,
    tensao: tensao,
    timestamp: new Date().toISOString()
  };
}

// Função para notificar todos os listeners
function notificarListeners(dados) {
  listeners.forEach(listener => {
    try {
      listener(dados);
    } catch (e) {
      console.error('Erro no listener:', e);
    }
  });
}

// API pública do Mock BLE Service
export const MockBLEService = {
  // Inicia a simulação
  iniciarSimulacao(callback) {
    console.log('🔵 Mock BLE: Iniciando simulação do ESP32');
    
    if (callback && typeof callback === 'function') {
      listeners.push(callback);
    }
    
    // Para simulação de dados contínuos
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Envia dados a cada 100ms (igual ao ESP32 real)
    intervalId = setInterval(() => {
      const dados = gerarDadosSimulados();
      
      // Cria pacote no formato esperado pelo parsePacket
      const tensaoCent = Math.round(dados.tensao * 100);
      const high = (tensaoCent >> 8) & 0xFF;
      const low = tensaoCent & 0xFF;
      
      // Calcula checksum (soma simples)
      const flag1 = 0xB1;
      const flag2 = 0x0A;
      const len = 3;
      const sum = (flag1 + flag2 + len + high + low) & 0xFF;
      
      // Cria array de bytes no formato do ESP32
      const packetBytes = [flag1, flag2, len, high, low, sum];
      
      // Converte para base64 (como vem do BLE real)
      const base64Packet = btoa(String.fromCharCode(...packetBytes));
      
      // Notifica listeners
      notificarListeners({
        value: base64Packet,
        raw: dados
      });
      
    }, 100);
    
    return true;
  },
  
  // Para a simulação
  pararSimulacao() {
    console.log('🔴 Mock BLE: Parando simulação');
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    listeners = [];
  },
  
  // Simula envio de comando START
  enviarStart() {
    console.log('📤 Mock BLE: START enviado (simulado)');
    return Promise.resolve();
  },
  
  // Simula envio de comando STOP
  enviarStop() {
    console.log('📤 Mock BLE: STOP enviado (simulado)');
    return Promise.resolve();
  },
  
  // Simula envio de calibração
  enviarCalibracao() {
    console.log('📤 Mock BLE: Calibração enviada (simulada)');
    return Promise.resolve();
  },
  
  // Verifica se está simulando
  estaSimulando() {
    return intervalId !== null;
  },
  
  // Adiciona listener
  adicionarListener(callback) {
    if (callback && typeof callback === 'function') {
      listeners.push(callback);
    }
  },
  
  // Remove listener
  removerListener(callback) {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
};

export default MockBLEService;