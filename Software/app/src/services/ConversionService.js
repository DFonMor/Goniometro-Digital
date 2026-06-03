// src/services/ConversionService.js
const TENSAO_MAX = 3.3;
const ANGULO_MAX = 180;

class ConversionService {
  constructor() {
    this.tensaoZero = 0;
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

export default new ConversionService();