// src/services/ConversionService.js

const TENSAO_MAX = 1.1;
const ANGULO_MAX = 180;

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
    let tensaoAjustada = tensao;
    
    if (this.tensaoZero > 0) {
      tensaoAjustada = tensao - this.tensaoZero;
      if (tensaoAjustada < 0) tensaoAjustada = 0;
    }
    
    let faixaUtil = TENSAO_MAX;
    if (this.tensaoZero > 0) {
      faixaUtil = TENSAO_MAX - this.tensaoZero;
    }
    
    if (faixaUtil <= 0) return 0;
    
    let angulo = (tensaoAjustada / faixaUtil) * ANGULO_MAX;
    
    if (angulo <= 0) return 0;
    if (angulo >= ANGULO_MAX) return ANGULO_MAX;
    
    return angulo;
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