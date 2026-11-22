const { EmbedBuilder } = require('discord.js');
const { autorEhStaff } = require('../utils/permissions');

const PREFIX = '!';
const COOLDOWN_MS = 2000;
const cooldowns = new Map();

const AJUDA_GERAL = [
  '`!painel` - abre o painel de ponto',
  '`!pontosRegistrados` - total de horas da unidade',
].join('\n');

const AJUDA_STAFF = [
  '`!pontos` - quem está com ponto aberto',
  '`!ultimosP @piloto` - últimos 5 plantões',
  '`!ajustarHoras @piloto <valor>` - soma ou tira horas',
  '`!fecharP @piloto` ou `<ID>` - fecha o ponto de alguém',
  '`!fecharTodosPontos` - fecha todos os pontos abertos',
  '`!zerarDados @piloto` ou `<ID>` - zera horas e apreensões',
  '`!zerarDados CONFIRMAR` - zera de todo mundo',
  '`!removerMembro @piloto` ou `<ID>` - apaga o registro',
  '`!excluirM <1-100>` - apaga mensagens do canal',
].join('\n');

const erroSilencioso = (err) => console.error('[messageCreate]', err.message);

async function enviarAjuda(message) {
  const staff = await autorEhStaff(message);

  const embed = new EmbedBuilder()
    .setTitle('📋 Comandos - Unidade Delta')
    .setColor('#5865F2')
    .addFields({ name: 'Geral', value: AJUDA_GERAL });

  if (staff) embed.addFields({ name: 'Liderança', value: AJUDA_STAFF });

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
