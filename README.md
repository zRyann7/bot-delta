# 🛡️ Bot Unidade Delta v2

Bot de gestão de plantões, ações e relatórios para o Discord da Unidade Delta.

---

## ⚙️ Instalação

```bash
# 1. Instale as dependências
npm install

# 2. Configure o arquivo de variáveis de ambiente
cp .env.example .env
# Edite o .env e preencha TOKEN e ID_CARGO_STAFF

# 3. Inicie o bot
npm start
```

---

## 🔧 Configuração do .env

| Variável | Descrição |
|---|---|
| `TOKEN` | Token do bot (Discord Developer Portal) |
| `ID_CARGO_STAFF` | ID do cargo que pode usar o Painel Staff |

Para obter o ID do cargo, ative o **Modo Desenvolvedor** em Configurações → Avançado, depois clique com botão direito no cargo e selecione "Copiar ID".

---

## 📋 Comandos de Texto

| Comando | Descrição | Permissão |
|---|---|---|
| `!painelDelta` | Abre o painel principal com os botões | Todos |
| `!exportarDelta` | Gera e envia o relatório Excel no canal | Staff |
| `!excluirM` | Exclui mensagem do canal | Staff |

---

## 🔘 Botões do Painel

| Botão | Descrição |
|---|---|
| 🟢 Iniciar Ponto | Registra o início do Ponto do membro |
| 🔴 Finalizar Ponto | Encerra o Ponto e soma as horas |
| 📊 Meu Perfil | Exibe horas, ações e status atual |
| 🏅 Ranking | Top 10 membros por horas acumuladas |
| ⚙️ Painel Staff | Permite lançar ações ganhas (apenas staff) |

---

## 🗃️ Banco de Dados

O bot usa SQLite (`unidade_delta.db`) com duas tabelas:

- **membros** — horas totais, ações e status de Ponto de cada membro
- **historico_plantoes** — registro de cada Ponto com início, fim e duração

---

## 📊 Exportação Excel

O comando `!exportarDelta` gera um arquivo `relatorio_delta.xlsx` com:

- Ranking de todos os membros
- Horas totais e ações por membro
- Status atual (em Ponto / fora de serviço)
- Estilo formatado com zebra e cabeçalho destacado

---

## 📁 Estrutura de Arquivos

```
bot_delta/
├── index.js         # Lógica principal do bot
├── database.js      # Funções do banco de dados SQLite
├── excel.js         # Geração do relatório Excel
├── package.json     # Dependências
├── .env             # Variáveis de ambiente (não commitar!)
└── .gitignore
```

---

## 🔒 Intents necessários no Portal

No [Discord Developer Portal](https://discord.com/developers/applications), em **Bot → Privileged Gateway Intents**, ative:

- ✅ Server Members Intent
- ✅ Message Content Intent
