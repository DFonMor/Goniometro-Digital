// src/services/StorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PACIENTES: '@goniometro:pacientes',
  MEDICOES: (id) => `@goniometro:medicoes_${id}`,
  CALIBRACAO: (id) => `@goniometro:calibracao_${id}`
};

// ===== PACIENTES =====
export async function salvarPacientes(pacientes) {
  await AsyncStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(pacientes));
}

export async function carregarPacientes() {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.PACIENTES);
  return data ? JSON.parse(data) : [];
}

export async function criarPaciente(nome) {
  const pacientes = await carregarPacientes();
  const novoPaciente = {
    id: Date.now().toString(),
    nome: nome,
    dataCriacao: new Date().toISOString(),
    totalMedicoes: 0
  };
  pacientes.push(novoPaciente);
  await salvarPacientes(pacientes);
  return novoPaciente;
}

export async function deletarPaciente(id) {
  const pacientes = await carregarPacientes();
  const filtrados = pacientes.filter(p => p.id !== id);
  await salvarPacientes(filtrados);
  await AsyncStorage.removeItem(STORAGE_KEYS.MEDICOES(id));
  await AsyncStorage.removeItem(STORAGE_KEYS.CALIBRACAO(id));
}

// ===== MEDIÇÕES =====
export async function salvarMedicao(pacienteId, medicao) {
  const key = STORAGE_KEYS.MEDICOES(pacienteId);
  const existentes = await carregarMedicoes(pacienteId);
  const novas = [medicao, ...existentes];
  await AsyncStorage.setItem(key, JSON.stringify(novas));
  
  // Atualizar contador do paciente
  const pacientes = await carregarPacientes();
  const paciente = pacientes.find(p => p.id === pacienteId);
  if (paciente) {
    paciente.totalMedicoes = novas.length;
    await salvarPacientes(pacientes);
  }
}

export async function carregarMedicoes(pacienteId) {
  const key = STORAGE_KEYS.MEDICOES(pacienteId);
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export async function deletarMedicao(pacienteId, medicaoId) {
  const medicoes = await carregarMedicoes(pacienteId);
  const filtradas = medicoes.filter(m => m.id !== medicaoId);
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICOES(pacienteId), JSON.stringify(filtradas));
}

// ===== CALIBRAÇÃO =====
export async function salvarCalibracao(pacienteId, tensaoZero) {
  const key = STORAGE_KEYS.CALIBRACAO(pacienteId);
  const calibracao = {
    tensaoZero: tensaoZero,
    dataCalibracao: new Date().toISOString()
  };
  await AsyncStorage.setItem(key, JSON.stringify(calibracao));
  return calibracao;
}

export async function carregarCalibracao(pacienteId) {
  const key = STORAGE_KEYS.CALIBRACAO(pacienteId);
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export async function deletarCalibracao(pacienteId) {
  const key = STORAGE_KEYS.CALIBRACAO(pacienteId);
  await AsyncStorage.removeItem(key);
}