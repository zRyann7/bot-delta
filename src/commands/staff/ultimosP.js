const { EmbedBuilder } = require('discord.js');
const { getUltimosPontos } = require('../../services/plantaoService');
const { formatarHoras } = require('../../utils/formatters');
const { resolverMembro } = require('../../utils/discordHelpers');

module.exports = {
  name: 'ultimosP',
  staffOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply('Use: `!ultimosP @usuario` ou `!ultimosP <ID>`');
    }

    const membro = await resolverMembro(message, args[0]);
    if (!membro) {
      return message.reply('Usuario nao encontrado. Mencione o membro ou informe o ID correto.');
    }

    try {
      const historico = await getUltimosPontos(membro.id, 5);

      if (!historico.length) {
        return message.reply(`Nenhum historico encontrado para **${membro.user.username}**.`);
      }

      const descricao = historico
        .map((registro, index) => {
          const entrada = new Date(registro.inicio).toLocaleString('pt-BR');
          const saida = new Date(registro.fim).toLocaleString('pt-BR');
          return (
            `**Plantao ${index + 1}**\n` +
            `Entrada: \`${entrada}\`\n` +
            `Saida: \`${saida}\`\n` +
            `Duracao: \`${formatarHoras(registro.duracao_horas)}\``
          );
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Ultimos Pontos - ${membro.user.username}`)
        .setDescription(descricao)
        .setFooter({ text: `ID: ${membro.id}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao consultar historico:', error);
      return message.reply('Erro ao consultar os ultimos pontos.');
    }
  },
};