# TODO 
---

## Front-End (Responsável: Front-End)

- [x] Criar estrutura inicial do app (React Native)
- [x] Implementar interface básica com dados simulados
- [x] Preparar tela para exibição em tempo real
- [x] Estruturar fluxo de salvamento de medições
- [ ] Implementar persistência local
- [x] Desenvolver visualização de histórico
- [x] Integrar comunicação BLE (dependente do firmware)
- [x] Build inicial para teste com ESP
- [ ] Implementar calibração de referência (definição de 0°)
- [ ] Adicionar função STOP
- [ ] Estrutura de pacientes

---

## Firmware / ESP32 (Dependências críticas)

- [ ] Testar velocidade da comunicação bluetooth
- [x] Padronizar o envio de dados como dois bytes
- [x] Realizar leitura da entrada para selecionar entre início da coleta e final da coleta
- [x] Mudar de Bluetooth SPP para Bluetooth BLE (veja sobre: BLEDevice.h, BLEServer.h, BLEUtils.h e BLE2902.h.)
- [ ] Verificar a conversão (é 5V mesmo ou 3.3V?)
- [x] Adicionar byte de sincronização (seria adicionar um header tipo SerialBT.write(0xAA), pois o app não sabe se perdeu o byte)
- [ ] Testar comunicação com App:
- [ ] Encontrou o ESP?
- [ ] Conectou?
- [ ] Recebeu o notify?
- [ ] O checksum passou?
- [ ] A tensão apareceu?

---

## Eletrônica

- [ ] Alterar comprimento dos cabos
- [x] Revisar as ligações
- [x] Fazer testes

---

## Mecânica

- [x]  Inserir abertura para carregamento
- [x]  Inserir chave On/Off
- [x]  Impressão teste
- [x]  Verificar folgas
- [x]  Terminar modelagem da fixação do sensor ao manguito
- [ ]  Terminar desenvolvimento da alça de fixação


