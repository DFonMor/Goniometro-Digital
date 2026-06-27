// src/components/PacienteFormModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// Opções para os pickers
const SEXO_OPCOES = [
  { label: 'Selecione', value: '' },
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Feminino', value: 'Feminino' },
  { label: 'Outro', value: 'Outro' },
];

const LADO_AFETADO_OPCOES = [
  { label: 'Selecione', value: '' },
  { label: 'Direito', value: 'Direito' },
  { label: 'Esquerdo', value: 'Esquerdo' },
  { label: 'Ambos', value: 'Ambos' },
];

export default function PacienteFormModal({ visible, onClose, onSave, paciente }) {
  // Estados para cada campo
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [ladoAfetado, setLadoAfetado] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [prontuario, setProntuario] = useState('');
  const [telefone, setTelefone] = useState('');

  // Determina se é edição ou criação
  const isEdit = !!paciente;

  // Preenche os campos quando o paciente (para edição) é fornecido
  useEffect(() => {
    if (paciente) {
      setNome(paciente.nome || '');
      setDataNascimento(paciente.dataNascimento || '');
      setSexo(paciente.sexo || '');
      setLadoAfetado(paciente.ladoAfetado || '');
      setDiagnostico(paciente.diagnostico || '');
      setProntuario(paciente.prontuario || '');
      setTelefone(paciente.telefone || '');
    } else {
      // Limpa os campos ao abrir para criação
      setNome('');
      setDataNascimento('');
      setSexo('');
      setLadoAfetado('');
      setDiagnostico('');
      setProntuario('');
      setTelefone('');
    }
  }, [paciente, visible]);

  // Função para formatar a data enquanto digita (máscara simples)
  const handleDataNascimentoChange = (text) => {
    // Remove caracteres não numéricos
    let cleaned = text.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    
    // Aplica máscara: DD/MM/AAAA
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += '/' + cleaned.slice(2, 4);
    }
    if (cleaned.length > 4) {
      formatted += '/' + cleaned.slice(4, 8);
    }
    
    setDataNascimento(formatted);
  };

  // Valida e salva
  const handleSalvar = () => {
    // Nome é obrigatório
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome do paciente é obrigatório.');
      return;
    }

    const dados = {
      nome: nome.trim(),
      dataNascimento: dataNascimento.trim() || null,
      sexo: sexo || null,
      ladoAfetado: ladoAfetado || null,
      diagnostico: diagnostico.trim() || '',
      prontuario: prontuario.trim() || '',
      telefone: telefone.trim() || '',
    };

    onSave(dados, isEdit);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? '✏️ Editar Paciente' : '➕ Novo Paciente'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Nome (obrigatório) */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Digite o nome completo"
                placeholderTextColor="#999" // <-- COR DO PLACEHOLDER VISÍVEL
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Data de Nascimento */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                value={dataNascimento}
                onChangeText={handleDataNascimentoChange}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#999" // <-- COR DO PLACEHOLDER VISÍVEL
                keyboardType="numeric"
                maxLength={10}
                returnKeyType="next"
              />
            </View>

            {/* Sexo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Sexo</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={sexo}
                  onValueChange={(itemValue) => setSexo(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#2c3e50"
                >
                  {SEXO_OPCOES.map((item) => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                      // REMOVIDO: color="#2c3e50" para não afetar a lista suspensa
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Lado Afetado */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Lado Afetado</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={ladoAfetado}
                  onValueChange={(itemValue) => setLadoAfetado(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#2c3e50"
                >
                  {LADO_AFETADO_OPCOES.map((item) => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                      // REMOVIDO: color="#2c3e50" para não afetar a lista suspensa
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Diagnóstico */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Diagnóstico</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={diagnostico}
                onChangeText={setDiagnostico}
                placeholder="Descrição da condição clínica"
                placeholderTextColor="#999" // <-- COR DO PLACEHOLDER VISÍVEL
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="next"
              />
            </View>

            {/* Prontuário */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Prontuário</Text>
              <TextInput
                style={styles.input}
                value={prontuario}
                onChangeText={setProntuario}
                placeholder="Número do prontuário"
                placeholderTextColor="#999" // <-- COR DO PLACEHOLDER VISÍVEL
                returnKeyType="next"
              />
            </View>

            {/* Telefone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#999" // <-- COR DO PLACEHOLDER VISÍVEL
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>

            {/* Botões de ação */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSalvar}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  formContainer: {
    paddingBottom: 10,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#2c3e50',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#2c3e50', // Cor do texto selecionado no campo fechado (não afeta a lista)
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});