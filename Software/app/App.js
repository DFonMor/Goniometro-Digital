import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';

export default function App() {
  const [angulo, setAngulo] = useState(0);
  const [historico, setHistorico] = useState([]);

  // Simulação de dados (substituir depois por BLE)
  useEffect(() => {
    const interval = setInterval(() => {
      const valorSimulado = (Math.random() * 90).toFixed(2);
      setAngulo(valorSimulado);
    }, 100); // 10 Hz

    return () => clearInterval(interval);
  }, []);

  const salvarMedicao = () => {
    const novaMedicao = {
      id: Date.now().toString(),
      valor: angulo,
      data: new Date().toLocaleTimeString()
    };

    setHistorico((prev) => [novaMedicao, ...prev]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Goniômetro Digital</Text>

      <Text style={styles.angulo}>
        Ângulo: {angulo}°
      </Text>

      <Button title="Salvar medição" onPress={salvarMedicao} />

      <Text style={styles.subtitulo}>Histórico</Text>

      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            {item.valor}° - {item.data}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  angulo: {
    fontSize: 32,
    marginBottom: 20
  },
  subtitulo: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10
  },
  item: {
    fontSize: 16,
    marginBottom: 5
  }
});