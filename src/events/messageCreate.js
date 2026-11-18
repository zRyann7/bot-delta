const { EmbedBuilder } = require('discord.js');
const { isStaff } = require('../utils/permissions');

const PREFIX = '!';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Resposta quando o bot é mencionado
    if (message.mentions.has(client.user) && !message.mentions.everyone) {
      const embed = new EmbedBuilder()
        .setTitle('🚔  Unidade Delta — Central de Comandos')
        .setColor('#5865F2')
        .setDescription(
          '> Bem-vindo ao sistema de ponto da **Unidade Delta**.\n' +
          '> Abaixo estao todos os comandos e funcionalidades disponiveis.'
        )
        .addFields(
          { name: '━━━━━━━━━━━━━━━━━━━━━━━━', value: '** **' },
          {
            name: '🟦  Painel Principal',
            value: '`!painel` — Abre o painel interativo com botoes de operacao',
            inline: false,
          },
          {
            name: '📋  Pontos Registrados',
            value: '`!pontosRegistrados` — Exibe o total de horas de todos os membros registrados',
            inline: false,
          },
          { name: '━━━━━━━━━━━━━━━━━━━━━━━━', value: '** **' },
          {
            name: '🎮  Botoes do Painel',
            value:
              '🟢 **Iniciar Ponto** — Registra sua entrada no expediente\n' +
              '🔴 **Finalizar Ponto** — Encerra o expediente e salva as horas\n' +
              '📊 **Meu Perfil** — Exibe suas horas, apreensoes e status',
            inline: false,
          },
          { name: '━━━━━━━━━━━━━━━━━━━━━━━━', value: '** **' },
          {
            name: '🔒  Comandos da Liderança',
            value:
              '`!ajustarHoras @usuario <valor>` — Adiciona ou remove horas de um piloto\n' +
              '`!fecharP @usuario` ou `!fecharP <ID do Discord>` — Encerra o ponto aberto de um piloto\n' +
              '`!fecharTodosPontos` — Encerra todos os pontos ativos de uma vez\n' +
              '`!pontos` — Lista todos os pilotos com ponto ativo\n' +
              '`!ultimosP @usuario` — Exibe os ultimos 5 plantoes do piloto\n' +
              '`!zerarDados @usuario` ou `!zerarDados <ID>` — Zera horas e apreensões de um membro (mantém o registro)\n' +
              '`!zerarDados CONFIRMAR` — Zera horas e apreensões de **todos** os membros\n' +
              '`!removerMembro @usuario` ou `!removerMembro <ID>` — Apaga definitivamente o registro de um membro\n' +
              '`!excluirM 1-100` — Apaga as ultimas N mensagens do canal (max. 100)',
            inline: false,
          },
          { name: '━━━━━━━━━━━━━━━━━━━━━━━━', value: '** **' }
        )
        .setFooter({ text: 'Unidade Delta · Sistema de Ponto  |  Mencione o bot para ver esta mensagem' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift();
    if (!commandName) return;

    const command = client.commands.get(commandName.toLowerCase());
    if (!command) return;

    if (command.staffOnly && !isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança Delta pode usar este comando.');
    }

    await command.execute(message, args, client);
  },
};