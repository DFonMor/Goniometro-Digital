// src/services/StorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PACIENTES: '@goniometro:pacientes',
  MEDICOES: (id) => `@goniometro:medicoes_${id}`,
  CALIBRACAO: (id) => `@goniometro:calibracao_${id}`
};

// ============================================================
//  MIGRAÇÃO (defensiva)
// ============================================================

function _migrarPaciente(p) {
  return {
    ...p,
    dataNascimento: p.dataNascimento ?? null,
    sexo: p.sexo ?? null,
    ladoAfetado: p.ladoAfetado ?? null,
    diagnostico: p.diagnostico ?? '',
    prontuario: p.prontuario ?? '',
    telefone: p.telefone ?? '',
  };
}

function _migrarMedicao(m) {
  return {
    ...m,
    movimento: m.movimento ?? null,
    anotacao: m.anotacao ?? '',
  };
}

// ============================================================
//  PACIENTES
// ============================================================

export async function salvarPacientes(pacientes) {
  await AsyncStorage.setItem(STORAGE_KEYS.PACIENTES, JSON.stringify(pacientes));
}

export async function carregarPacientes() {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.PACIENTES);
  let pacientes = data ? JSON.parse(data) : [];
  return pacientes.map(_migrarPaciente);
}

export async function criarPaciente(nome) {
  const pacientes = await carregarPacientes();
  const novo = {
    id: Date.now().toString(),
    nome,
    dataCriacao: new Date().toISOString(),
    totalMedicoes: 0,
    // campos novos já serão definidos pela migração no carregamento,
    // mas para segurança já os incluímos:
    dataNascimento: null,
    sexo: null,
    ladoAfetado: null,
    diagnostico: '',
    prontuario: '',
    telefone: '',
  };
  pacientes.push(novo);
  await salvarPacientes(pacientes);
  return novo;
}

export async function deletarPaciente(id) {
  const pacientes = await carregarPacientes();
  const filtrados = pacientes.filter(p => p.id !== id);
  await salvarPacientes(filtrados);
  await AsyncStorage.removeItem(STORAGE_KEYS.MEDICOES(id));
  await AsyncStorage.removeItem(STORAGE_KEYS.CALIBRACAO(id));
}

// ===== NOVA FUNÇÃO =====
export async function atualizarPaciente(id, novosDados) {
  const pacientes = await carregarPacientes();
  const index = pacientes.findIndex(p => p.id === id);
  if (index === -1) {
    throw new Error('Paciente não encontrado');
  }
  pacientes[index] = { ...pacientes[index], ...novosDados };
  await salvarPacientes(pacientes);
  return pacientes[index];
}

// ============================================================
//  MEDIÇÕES
// ============================================================

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
  let medicoes = data ? JSON.parse(data) : [];
  return medicoes.map(_migrarMedicao);
}

export async function deletarMedicao(pacienteId, medicaoId) {
  const medicoes = await carregarMedicoes(pacienteId);
  const filtradas = medicoes.filter(m => m.id !== medicaoId);
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICOES(pacienteId), JSON.stringify(filtradas));
}

// ===== NOVA FUNÇÃO =====
export async function atualizarMedicao(pacienteId, medicaoId, novosDados) {
  const medicoes = await carregarMedicoes(pacienteId);
  const index = medicoes.findIndex(m => m.id === medicaoId);
  if (index === -1) {
    throw new Error('Medição não encontrada');
  }
  medicoes[index] = { ...medicoes[index], ...novosDados };
  await AsyncStorage.setItem(STORAGE_KEYS.MEDICOES(pacienteId), JSON.stringify(medicoes));
  return medicoes[index];
}

// ============================================================
//  CALIBRAÇÃO
// ============================================================

export async function salvarCalibracao(pacienteId, tensaoZero) {
  const key = STORAGE_KEYS.CALIBRACAO(pacienteId);
  const calibracao = {
    tensaoZero,
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