# TODO - Integração do Sistema

## Objetivo imediato
Definir a interface de comunicação entre ESP32 e aplicativo mobile para viabilizar o desenvolvimento do front-end.

---

## Front-End (Responsável: Front-End)

- [x] Criar estrutura inicial do app (React Native)
- [x] Implementar interface básica com dados simulados
- [x] Preparar tela para exibição em tempo real
- [~] Estruturar fluxo de salvamento de medições
- [ ] Implementar persistência local
- [x] Desenvolver visualização de histórico
- [ ] Integrar comunicação BLE (dependente do firmware)

---

## Firmware / ESP32 (Dependências críticas)

- [~] Testar velocidade da comunicação bluetooth
- [x] Padronizar o envio de dados como dois bytes
- [x] Realizar leitura da entrada para selecionar entre início da coleta e final da coleta
- [ ] Mudar de Bluetooth SPP para Bluetooth BLE
        Veja sobre: #include <BLEDevice.h>
                    #include <BLEServer.h>
                    #include <BLEUtils.h>
                    #include <BLE2902.h>
- [ ] Verificar a conversão (é 5V mesmo ou 3.3V?)
- [ ] Adicionar byte de sincronização

---

## Eletrônica

- [ ] Alterar comprimento dos cabos
- [ ] Revisar as ligações
- [~] Fazer testes

---

## Mecânica

- [x]  Inserir abertura para carregamento
- [x]  Inserir chave On/Off
- [x]  Impressão teste
- [-]  Conversar com o professor responsável pela impressão 3D
- [ ]  Verificar folgas

