# Goniometro-Digital
Repositório para o desenvolvimento de um dispositivo para a disciplina de Projeto Integrador em Engenharia Mecatrônica

# Introdução

O presente projeto tem como objetivo o desenvolvimento de um goniômetro digital, destinado à medição da amplitude de movimento de articulações, com foco em aplicações na área de fisioterapia. Diferentemente dos modelos analógicos tradicionais, que dependem de leitura manual e anotação dos resultados, a solução proposta busca automatizar tanto a aquisição quanto o armazenamento dos dados.

O sistema será composto por um sensor de posição acoplado a um microcontrolador (ESP32), responsável por realizar a leitura e o processamento dos dados, além de comunicar as medições a um aplicativo mobile por meio de conexão sem fio. O aplicativo permitirá a visualização em tempo real, bem como o armazenamento do histórico de medições associadas a cada paciente.

Essa abordagem visa aumentar a precisão das medições, reduzir erros humanos e proporcionar maior praticidade ao profissional durante o acompanhamento da evolução dos pacientes, centralizando todas as informações em uma única plataforma digital.

# Sistema

O sistema proposto é composto por três módulos principais: o dispositivo embarcado, o aplicativo mobile e o mecanismo de armazenamento de dados.

O dispositivo embarcado é baseado no microcontrolador ESP32, responsável pela aquisição dos sinais provenientes do sensor por meio de seu conversor analógico-digital (ADC). A partir dessas leituras, o sistema realiza o processamento necessário para obtenção da medida de ângulo das articulações.

A comunicação entre o dispositivo e o usuário é realizada por meio de Bluetooth Low Energy (BLE), permitindo a transmissão dos dados em tempo real para um dispositivo móvel. A escolha do BLE foi motivada pelo seu baixo consumo energético, simplicidade de conexão com smartphones e adequação a aplicações portáteis, características essenciais para o contexto de uso do goniômetro.

O aplicativo mobile será desenvolvido utilizando o framework React Native, sendo responsável por estabelecer a conexão com o ESP32, receber os dados transmitidos e apresentá-los ao usuário em tempo real. Além disso, o aplicativo permitirá o armazenamento das medições, possibilitando o acompanhamento do histórico de cada paciente, conforme previsto no escopo do projeto.



## Back-End

O back-end do projeto é composto pelo firmware desenvolvido para o microcontrolador ESP32, responsável pela leitura do sensor analógico e transmissão dos dados via Bluetooth Low Energy (BLE). O firmware foi implementado em C++ utilizando o framework Arduino, com as seguintes características:

- **Leitura analógica**: O ESP32 realiza a leitura do sinal proveniente de um potenciômetro linear (ou sensor de ângulo) conectado a um pino ADC, com resolução de 12 bits (0–4095) e atenuação configurada para a faixa de 0 a 3,3 V.

- **Conversão para tensão**: O valor cru do ADC é convertido para tensão (em volts) utilizando a referência de 3,3 V, resultando em valores entre 0 e 3,3 V.

- **Comunicação BLE**: O ESP32 atua como periférico BLE, anunciando o serviço com UUID personalizado e disponibilizando uma característica para leitura/escrita/notificação. O dispositivo aguarda comandos enviados pelo aplicativo mobile e responde com pacotes de dados estruturados.

- **Protocolo de comunicação**: Os dados são transmitidos em pacotes com o formato `[FLAG_1][FLAG_2][LEN][DATA ...][CHECKSUM]`, onde:
  - `FLAG_1` e `FLAG_2` identificam o tipo de mensagem (requisição, resposta ou calibração);
  - `LEN` indica o número de bytes em `DATA` + `CHECKSUM`;
  - `CHECKSUM` é calculado como a soma simples dos bytes anteriores.
  - Os comandos suportados incluem `START` (início da transmissão), `STOP` (interrupção da transmissão) e `CALIBRATE` (solicitação de calibração do zero).

- **Resposta do dispositivo**: O ESP32 envia pacotes de resposta contendo a tensão medida em centésimos de volt (HIGH e LOW), juntamente com o checksum correspondente.

- **Persistência de calibração**: O firmware armazena o offset de calibração (valor do ADC correspondente ao ângulo zero) na memória flash (via `Preferences`), garantindo que a calibração seja mantida mesmo após reinicializações.

O firmware foi projetado para ser estável, com baixo consumo de energia e compatível com as especificações do hardware do goniômetro.

---

## Front-End

O desenvolvimento do front-end é realizado por meio de um aplicativo mobile utilizando o framework React Native com Expo. O aplicativo é responsável por estabelecer a interface entre o usuário e o dispositivo embarcado, permitindo a visualização, interação e armazenamento das medições realizadas.

A arquitetura do aplicativo foi organizada em camadas (serviços, componentes, utilitários e contextos) para facilitar a manutenção e a evolução do código. A comunicação com o ESP32 é feita via Bluetooth Low Energy (BLE) utilizando a biblioteca `react-native-ble-plx`, com suporte a modo de simulação (mock) para testes sem hardware.

### Funcionalidades implementadas

- **Conexão com o dispositivo**  
  Busca e conexão com o ESP32 via BLE, com indicação visual do status (conectado, conectando, desconectado). O aplicativo permite iniciar/parar a transmissão de dados (comandos START/STOP) e desconectar completamente, mantendo a lógica de controle separada para maior flexibilidade.

- **Recepção e processamento de dados em tempo real**  
  Leitura contínua dos pacotes BLE enviados pelo microcontrolador, com validação de integridade (verificação de checksum) e parsing dos campos. Os dados de tensão são convertidos em ângulo utilizando uma função de mapeamento linear calibrada. Um filtro de mediana com janela de 12 amostras é aplicado para suavizar as leituras e reduzir ruídos.

- **Exibição das medições**  
  Apresentação clara e direta dos valores de tensão (V) e ângulo (°) na tela principal, com atualização dinâmica a cada novo pacote recebido. O ângulo é exibido em destaque, facilitando a leitura durante o uso clínico.

- **Perfil do Paciente Expandido**  
  Gerenciamento completo de pacientes, com criação, edição e exclusão de perfis. Cada perfil armazena:
  - Nome (obrigatório)
  - Data de nascimento
  - Sexo (Masculino, Feminino, Outro)
  - Lado afetado (Direito, Esquerdo, Ambos)
  - Diagnóstico / condição clínica
  - Número de prontuário
  - Telefone para contato
  A edição é feita por meio de um modal com formulário organizado, incluindo campos com máscara (data) e seletores (sexo, lado afetado).

- **Seleção de Movimento**  
  Antes de salvar uma medição, o usuário pode selecionar o tipo de movimento realizado (Punho, Cotovelo, Joelho, Tornozelo, Outro). O movimento é registrado junto com a medição e exibido no histórico, permitindo filtrar ou categorizar os dados futuramente.

- **Registro de medições**  
  Funcionalidade para salvar a medição atual no perfil do paciente ativo, associando-a a um timestamp e ao movimento selecionado. Os dados são armazenados localmente no dispositivo utilizando AsyncStorage, com estrutura organizada por paciente.

- **Histórico completo com anotações e exclusão**  
  Tela dedicada (modal) que exibe todas as medições de um paciente, com as seguintes ações por item:
  - **Visualização de anotação**: cada medição pode ter uma anotação de texto livre, exibida na lista com suporte a expansão/colapso (ver mais/ver menos).
  - **Edição de anotação**: ao tocar no ícone ⋮, o usuário pode adicionar ou editar a anotação através de um modal com campo de texto.
  - **Exclusão de medição**: opção para deletar uma medição com confirmação, removendo-a do armazenamento e da lista.

- **Calibração do zero**  
  O aplicativo permite calibrar o ponto de zero (0°) do sensor, armazenando a tensão correspondente a essa posição no perfil do paciente. A calibração é aplicada em todas as medições subsequentes daquele paciente, ajustando a conversão tensão→ângulo de forma personalizada.

- **Modo de simulação (Mock)**  
  Para facilitar o desenvolvimento e testes sem o hardware físico, o aplicativo possui um modo de simulação que gera dados sintéticos (variação senoidal do ângulo entre 0° e 180°) e os envia com a mesma estrutura de pacotes do ESP32 real. Esse modo é ativado por uma flag (`USE_MOCK`) no código.

### Armazenamento

Atualmente, o aplicativo utiliza o **AsyncStorage** para persistência local dos dados, com as seguintes chaves principais:

- `pacientes`: lista de todos os pacientes cadastrados.
- `medicoes_{id}`: array de medições de cada paciente, contendo ângulo, tensão, movimento, timestamp e anotação.
- `calibracao_{id}`: dados de calibração (tensão de zero) para cada paciente.

A estrutura de dados foi projetada para ser extensível, e o aplicativo já realiza migração automática de versões antigas, garantindo compatibilidade com registros existentes.

### Estratégia de desenvolvimento

O desenvolvimento seguiu uma abordagem incremental, com as seguintes etapas concluídas:

1. ✅ Implementação da interface básica e simulação de dados (mock);
2. ✅ Integração com o módulo de comunicação BLE (real e mock);
3. ✅ Implementação das funcionalidades de armazenamento local (AsyncStorage);
4. ✅ Desenvolvimento da visualização de histórico com anotações e exclusão;
5. ⏳ Integração futura com serviços em nuvem (planejada para versões posteriores).

### Próximos passos (futuro)

- Exportação de dados em formato CSV/PDF para relatórios;
- Sincronização com nuvem (Firebase ou outro backend) para compartilhamento entre dispositivos;
- Gráficos de evolução do paciente ao longo do tempo;
- Suporte a múltiplos idiomas;
- Melhorias na interface para tablets e telas maiores.