// src/components/ControlButtons.js
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function ControlButtons({ 
  conectado, 
  conectando, 
  onConectar, 
  onDesconectar, 
  onSalvar, 
  onCalibrar 
}) {
  if (!conectado && !conectando) {
    return (
      <TouchableOpacity style={styles.conectarButton} onPress={onConectar}>
        <Text style={styles.buttonText}>Conectar</Text>
      </TouchableOpacity>
    );
  }
  
  if (conectado) {
    return (
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.salvarButton} onPress={onSalvar}>
          <Text style={styles.buttonText}>Salvar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.calibrarButton} onPress={onCalibrar}>
          <Text style={styles.buttonText}>Calibrar 0°</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.stopButton} onPress={onDesconectar}>
          <Text style={styles.buttonText}>Parar</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20
  },
  conectarButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20
  },
  salvarButton: {
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  calibrarButton: {
    backgroundColor: '#9b59b6',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});