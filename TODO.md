# TODO 
---

## Front-End (Responsável: Front-End)

- [x] Criar estrutura inicial do app (React Native)
- [x] Implementar interface básica com dados simulados
- [x] Preparar tela para exibição em tempo real
- [x] Estruturar fluxo de salvamento de medições
- [ ] Implementar persistência local
- [x] Desenvolver visualização de histórico
- [ ] Integrar comunicação BLE (dependente do firmware)
- [ ] Implementar calibração de referência (definição de 0°)

---

## Firmware / ESP32 (Dependências críticas)

- [ ] Testar velocidade da comunicação bluetooth
- [x] Padronizar o envio de dados como dois bytes
- [x] Realizar leitura da entrada para selecionar entre início da coleta e final da coleta
- [ ] Mudar de Bluetooth SPP para Bluetooth BLE
        Veja sobre: #include <BLEDevice.h>
                    #include <BLEServer.h>
                    #include <BLEUtils.h>
                    #include <BLE2902.h>
- [ ] Verificar a conversão (é 5V mesmo ou 3.3V?)
- [ ] Adicionar byte de sincronização
        Seria adicionar um header tipo SerialBT.write(0xAA), pois o app não sabe se perdeu o byte

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
- [ ]  Verificar folgas
- [ ]  Terminar modelagem da fixação do sensor ao manguito
- [ ]  Terminar desenvolvimento da alça de fixação


