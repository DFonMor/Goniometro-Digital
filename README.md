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

Descreve o que você já tem pronto.

## Front-End

O desenvolvimento do front-end será realizado por meio de um aplicativo mobile utilizando o framework React Native. O aplicativo será responsável por estabelecer a interface entre o usuário e o dispositivo embarcado, permitindo a visualização, interação e armazenamento das medições realizadas.

Inicialmente, o foco do desenvolvimento estará na implementação de uma interface funcional e simples, priorizando a correta exibição dos dados e a integração com o sistema de comunicação via Bluetooth Low Energy (BLE).

### Funcionalidades previstas

- **Conexão com o dispositivo**  
  Implementação da busca e conexão com o ESP32 via BLE, permitindo o pareamento com o dispositivo;

- **Recepção de dados em tempo real**  
  Leitura contínua dos dados enviados pelo microcontrolador e atualização dinâmica da interface com os valores de ângulo medidos;

- **Exibição das medições**  
  Apresentação clara e direta dos valores obtidos, possibilitando o acompanhamento em tempo real pelo usuário;

- **Registro de medições**  
  Funcionalidade para armazenamento local dos dados coletados, associando-os a pacientes e datas;

- **Histórico de dados**  
  Visualização das medições anteriores, permitindo análise da evolução do paciente ao longo do tempo.

### Armazenamento

Em etapas iniciais, o armazenamento será realizado localmente no dispositivo móvel. Posteriormente, está prevista a integração com serviços em nuvem para sincronização e persistência dos dados.

### Estratégia de desenvolvimento

O desenvolvimento seguirá uma abordagem incremental, composta pelas seguintes etapas:

1. Implementação da interface básica e simulação de dados;
2. Integração com o módulo de comunicação BLE;
3. Implementação das funcionalidades de armazenamento local;
4. Desenvolvimento da visualização de histórico;
5. Integração futura com serviços em nuvem.
