const { EmbedBuilder } = require('discord.js');
const { autorEhStaff } = require('../utils/permissions');

const PREFIX = '!';
const COOLDOWN_MS = 2000;
const cooldowns = new Map();

const AJUDA = [
  '`!painel` - posta o painel de ponto no canal',
  '`!pontosRegistrados` - total de horas da unidade',
  '`!pontos` - quem está com ponto aberto',
  '`!ultimosP @piloto` - últimos 5 plantões',
  '`/ajustarhoras` - abre a tela para adicionar ou remover horas',
  '`!fecharP @piloto` ou `<ID>` - fecha o ponto de alguém',
  '`!fecharTodosPontos` - fecha todos os pontos abertos',
  '`!zerarDados @piloto` ou `<ID>` - zera horas e apreensões',
  '`!zerarDados CONFIRMAR` - zera de todo mundo',
  '`!removerMembro @piloto` ou `<ID>` - apaga o registro',
  '`!excluirM <1-100>` - apaga mensagens do canal',
].join('\n');

const erroSilencioso = (err) => console.error('[messageCreate]', err.message);

async function enviarAjuda(message) {
  if (!(await autorEhStaff(message))) return;

  const embed = new EmbedBuilder()
    .setTitle('Comandos da Liderança - Unidade Delta')
    .setColor('#5865F2')
    .setDescription(AJUDA);

  return message
    .reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
    .catch(erroSilencioso);
}

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const texto = message.content.trim();

    // só mencionou o bot, sem mais nada
    if (texto === `<@${client.user.id}>` || texto === `<@!${client.user.id}>`) {
      return enviarAjuda(message);
    }

    if (!texto.startsWith(PREFIX)) return;

    const args = texto.slice(PREFIX.length).split(/\s+/);
    const command = client.commands.get(args.shift().toLowerCase());
    if (!command) return;

    const agora = Date.now();
    if (agora - (cooldowns.get(message.author.id) || 0) < COOLDOWN_MS) return;
    cooldowns.set(message.author.id, agora);

    if (command.staffOnly && !(await autorEhStaff(message))) {
      return message
        .reply({
          content: 'Acesso negado. Apenas a liderança Delta pode usar esse comando.',
          allowedMentions: { repliedUser: false },
        })
        .catch(erroSilencioso);
    }

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`[Erro no comando ${command.name}]:`, error);
      message
        .reply({
          content: 'Deu erro ao executar o comando, tenta de novo.',
          allowedMentions: { repliedUser: false },
        })
        .catch(erroSilencioso);
    }
  },
};
