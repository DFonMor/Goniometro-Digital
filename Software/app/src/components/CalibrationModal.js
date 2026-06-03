// src/components/CalibrationModal.js
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

export default function CalibrationModal({ visible, onConfirm, onCancel, tensaoAtual }) {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Calibrar 0°</Text>
          
          <Text style={styles.message}>
            Posicione o sensor em 0° e confirme.
          </Text>
          
          {tensaoAtual && (
            <Text style={styles.tensao}>
              Tensão atual: {tensaoAtual} V
            </Text>
          )}
          
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>Confirmar</Text>
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
    width: '80%',
    alignItems: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16
  },
  tensao: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 24
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
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
  confirmText: {
    color: 'white',
    fontWeight: 'bold'
  }
});