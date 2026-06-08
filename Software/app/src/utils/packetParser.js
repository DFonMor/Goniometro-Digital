// src/utils/packetParser.js
import { Buffer } from 'buffer';
import { validateChecksum } from './checksumValidator';
import ConversionService from '../services/ConversionService'; 

// Função de conversão interna
function converterTensaoParaAngulo(tensao) {
  return ConversionService.converterTensaoParaAngulo(tensao);
}

export function parsePacket(base64Value, converterFn = converterTensaoParaAngulo) {
  const buffer = Buffer.from(base64Value, 'base64');
  const bytes = Uint8Array.from(buffer);
  
  if (bytes.length < 6) {
    return { success: false, error: 'incomplete' };
  }
  
  const flag1 = bytes[0];
  const flag2 = bytes[1];
  const high = bytes[3];
  const low = bytes[4];
  
  if (flag1 !== 0xB1) {
    return { success: false, error: 'invalid_flag1' };
  }
  
  if (!validateChecksum(bytes)) {
    return { success: false, error: 'invalid_checksum' };
  }
  
  // Pacote de calibração (resposta do ESP32)
  if (flag2 === 0xFF) {
    const status = bytes[3];
    return {
      success: true,
      type: 'calibration',
      status: status,
      statusText: status === 0x01 ? 'sucesso' : 'falha'
    };
  }
  
  // Pacote de dados
  if (flag2 !== 0x0A) {
    return { success: false, error: 'invalid_flag2' };
  }
  
  const tensao = ((high << 8) | low) / 100.0;
  const angulo = converterFn(tensao);
  
  return {
    success: true,
    type: 'data',
    tensao: tensao,
    tensaoCent: (high << 8) | low,
    angulo: angulo
  };
}