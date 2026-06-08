// src/utils/checksumValidator.js

export function validateChecksum(bytes) {
  if (bytes.length < 6) return false;
  
  let soma = 0;
  for (let i = 0; i < 5; i++) {
    soma += bytes[i];
  }
  soma = soma & 0xFF;
  
  return soma === bytes[5];
}

export function calculateChecksum(bytes, length) {
  let soma = 0;
  const len = length || bytes.length;
  for (let i = 0; i < len; i++) {
    soma += bytes[i];
  }
  return soma & 0xFF;
}