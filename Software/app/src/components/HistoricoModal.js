// src/components/HistoricoModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

// Componente para editar anotação (inline dentro do modal)
const AnotacaoModal = ({ visible, onClose, onSave, anotacaoAtual }) => {
  const [texto, setTexto] = useState(anotacaoAtual || '');

  React.useEffect(() => {
    if (visible) {
      setTexto(anotacaoAtual || '');
    }
  }, [visible, anotacaoAtual]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.anotacaoOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.anotacaoContainer}>
          <Text style={styles.anotacaoTitle}>Anotação</Text>
          <TextInput
            style={styles.anotacaoInput}
            value={texto}
            onChangeText={setTexto}
            placeholder="Digite sua anotação..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.anotacaoButtons}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={() => onSave(texto)}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function HistoricoModal({
  visible,
  onClose,
  medicoes,
  paciente,
  onAtualizarMedicao,
  onDeletarMedicao
}) {
  const [modalAnotacaoVisible, setModalAnotacaoVisible] = useState(false);
  const [medicaoEditando, setMedicaoEditando] = useState(null);
  // ===== NOVO ESTADO PARA CONTROLAR EXPANSÃO =====
  const [expandedId, setExpandedId] = useState(null);

  const abrirAnotacao = (medicao) => {
    setMedicaoEditando(medicao);
    setModalAnotacaoVisible(true);
  };

  const salvarAnotacao = async (texto) => {
    if (!medicaoEditando) return;
    await onAtualizarMedicao(medicaoEditando.id, { anotacao: texto.trim() });
    setModalAnotacaoVisible(false);
    setMedicaoEditando(null);
  };

  const confirmarExclusao = (medicao) => {
    Alert.alert(
      'Excluir Medição',
      'Tem certeza que deseja excluir esta medição? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await onDeletarMedicao(medicao.id);
          }
        }
      ]
    );
  };

  // Função para alternar expansão
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }) => {
    const movimentoLabel = item.movimento || 'N/A';
    const isExpanded = expandedId === item.id;

    return (
      <View style={styles.historicoItem}>
        <View style={styles.historicoInfo}>
          <Text style={styles.historicoAngulo}>{item.angulo}°</Text>
          <Text style={styles.historicoMovimento}>{movimentoLabel}</Text>
          <Text style={styles.historicoData}>{item.dataHora || '--'}</Text>
          
          {/* ===== ANOTAÇÃO COM EXPANSÃO ===== */}
          {item.anotacao ? (
            <View style={styles.anotacaoContainerItem}>
              <Text style={styles.anotacaoIcon}>📝</Text>
              <View style={styles.anotacaoTextWrapper}>
                <Text
                  style={styles.anotacaoTexto}
                  numberOfLines={isExpanded ? 0 : 2}
                  onPress={() => toggleExpand(item.id)}
                >
                  {item.anotacao}
                </Text>
                {/* Botão "Ver mais/menos" aparece se a anotação for longa */}
                {item.anotacao.length > 60 && (
                  <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                    <Text style={styles.verMais}>
                      {isExpanded ? 'Ver menos' : 'Ver mais'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.historicoRight}>
          <Text style={styles.historicoTensao}>{item.tensao} V</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Ações',
                'O que deseja fazer?',
                [
                  {
                    text: item.anotacao ? 'Editar Anotação' : 'Adicionar Anotação',
                    onPress: () => abrirAnotacao(item)
                  },
                  {
                    text: 'Excluir Medição',
                    style: 'destructive',
                    onPress: () => confirmarExclusao(item)
                  },
                  { text: 'Cancelar', style: 'cancel' }
                ],
                { cancelable: true }
              );
            }}
            style={styles.menuButton}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Histórico {paciente ? `- ${paciente.nome}` : ''}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {medicoes && medicoes.length > 0 ? (
            <FlatList
              data={medicoes}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma medição salva para este paciente.</Text>
            </View>
          )}

          <AnotacaoModal
            visible={modalAnotacaoVisible}
            onClose={() => {
              setModalAnotacaoVisible(false);
              setMedicaoEditando(null);
            }}
            onSave={salvarAnotacao}
            anotacaoAtual={medicaoEditando?.anotacao}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  listContent: {
    paddingBottom: 20,
  },
  historicoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historicoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  historicoAngulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    minWidth: 50,
  },
  historicoMovimento: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    minWidth: 60,
  },
  historicoData: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  // ===== ESTILOS DA ANOTAÇÃO (COM EXPANSÃO) =====
  anotacaoContainerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
    marginTop: 4,
  },
  anotacaoIcon: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  anotacaoTextWrapper: {
    flex: 1,
    flexDirection: 'column',
  },
  anotacaoTexto: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  verMais: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '500',
    marginTop: 2,
  },
  historicoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 8,
  },
  historicoTensao: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  menuButton: {
    padding: 6,
  },
  menuIcon: {
    fontSize: 22,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
  // Estilos do modal de anotação
  anotacaoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  anotacaoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
  },
  anotacaoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  anotacaoInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
    color: '#2c3e50',
    textAlignVertical: 'top',
  },
  anotacaoButtons: {
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