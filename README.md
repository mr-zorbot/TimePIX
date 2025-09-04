# ⏳ TimePIX  

**TimePIX** é um aplicativo de **banco de tempo**, uma plataforma onde as pessoas podem trocar serviços usando **horas como moeda**, em vez de dinheiro. Cada hora de serviço prestado equivale a **1 crédito** que pode ser usado para "comprar" outra hora de serviço oferecido por outro participante.  

---

## 📌 Como funciona um Banco de Tempo?  
- Usuário A oferece 2h de aula de inglês.  
- Usuário B aceita a oferta e "paga" com 2 horas do seu saldo.  
- O sistema credita **+2h** na conta do Usuário A e debita **–2h** na conta do Usuário B.  
- Todos os usuários partem de um saldo inicial e podem acumular ou gastar horas conforme participam da comunidade.  

O objetivo é incentivar a **colaboração e solidariedade** dentro de uma rede de pessoas, valorizando o tempo de cada um igualmente.  

---

## ⚙️ Tecnologias utilizadas  

### 🐍 Flask  
O **Flask** é o framework web em Python que serve como núcleo do TimePIX, responsável por gerenciar cadastro, login, ofertas, solicitações e saldos dos usuários, além de atuar como ponto central de integração entre o banco de dados e o sistema de mensageria.  

### 📬 RabbitMQ  
O **RabbitMQ** é o sistema de mensageria do TimePIX, responsável por tornar os processos assíncronos e escaláveis, organizando filas de transações, notificações e auditoria para evitar sobrecarga da aplicação mesmo em alto volume de usuários.  

### 🗄️ SQLite  
O **SQLite** é o banco de dados leve e embutido do TimePIX, ideal para protótipos, armazenando usuários, ofertas, solicitações, transações e saldos de horas, sem necessidade de servidor dedicado, o que simplifica instalação e testes.  

---

## 🚀 Como será a arquitetura do TimePIX  

1. O usuário interage com a **interface Flask** (web/app).  
2. Flask registra a solicitação no **SQLite** e envia uma mensagem para a fila correspondente no **RabbitMQ**.  
3. Um **consumidor RabbitMQ** processa a transação, atualiza o saldo de horas no banco e publica eventos de notificação.  
4. O usuário recebe a confirmação do processo, e as informações ficam disponíveis em tempo real na interface.  

---

## 📅 Próximos passos  
- Implementar cadastro e autenticação de usuários.  
- Criar fluxo básico de oferta/solicitação de horas.  
- Configurar consumidores do RabbitMQ para processar transações.  
- Integrar notificações para feedback imediato.
