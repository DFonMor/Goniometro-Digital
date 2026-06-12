// src/services/ConversionService.js

// Instância única (singleton)
let instance = null;

class ConversionService {
  constructor() {
    if (instance) {
      return instance;
    }
    this.tensaoZero = 0;
    instance = this;
  }

  setCalibrationZero(tensao) {
    this.tensaoZero = tensao;
  }

  resetCalibration() {
    this.tensaoZero = 0;
  }

  converterTensaoParaAngulo(tensao) {
    return (tensao - this.tensaoZero) * 150;
  }
}

// Cria a instância única
const conversionService = new ConversionService();

// Exporta a instância como default
export default conversionService;

// 🔧 Exporta a função diretamente (sem depender da instância)
export function converterTensaoParaAngulo(tensao) {
  return conversionService.converterTensaoParaAngulo(tensao);
}
