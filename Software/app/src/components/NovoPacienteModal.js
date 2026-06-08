// src/components/NovoPacienteModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

export default function NovoPacienteModal({ visible, onConfirm, onCancel }) {
  const [nome, setNome] = useState('');

  const handleConfirm = () => {
    if (nome.trim()) {
      onConfirm(nome.trim());
      setNome('');
    }
  };

  const handleCancel = () => {
    setNome('');
    onCancel();
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Novo Paciente</Text>
          
          <Text style={styles.label}>Digite o nome do paciente:</Text>
          
          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Ex: João Silva"
            autoFocus={true}
            autoCapitalize="words"
          />
          
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, !nome.trim() && styles.confirmButtonDisabled]} 
              onPress={handleConfirm}
              disabled={!nome.trim()}
            >
              <Text style={styles.confirmText}>Criar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2c3e50'
  },
  label: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold'
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonDisabled: {
    backgroundColor: '#95a5a6'
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold'
  }
});