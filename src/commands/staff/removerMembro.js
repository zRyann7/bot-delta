const { EmbedBuilder } = require('discord.js');
const { getMembro, removerMembro } = require('../../services/membroService');
const { formatarHoras } = require('../../utils/formatters');
const { enviarLog } = require('../../utils/discordHelpers');

module.exports = {
  name: 'removerMembro',
  staffOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Uso correto: `!removerMembro @usuario` ou `!removerMembro <ID do Discord>`');
    }

    const alvoMembro = message.mentions.members.first();
    const alvoId = alvoMembro?.id || args[0].replace(/\D/g, '');

    if (!alvoId) {
      return message.reply('❌ Informe uma marcação válida (`@usuario`) ou um ID do Discord (apenas números).');
    }

    try {
      const dados = await getMembro(alvoId);
      if (!dados.username) {
        return message.reply(`❌ <@${alvoId}> não possui registro no banco de dados.`);
      }

      await removerMembro(alvoId);

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🗑️ Membro Removido do Banco')
        .setDescription(`O registro de <@${alvoId}> (\`${dados.username}\`) foi apagado permanentemente.`)
        .addFields(
          { name: 'Horas que possuía', value: `\`${formatarHoras(dados.horas || 0)}\``, inline: true },
          { name: 'Executado por', value: `<@${message.author.id}>`, inline: true }
        )
        .setFooter({ text: 'O histórico de plantões e apreensões foi mantido para consulta.' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      await enviarLog(message.guild, embed);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      return message.reply('❌ Erro ao remover o membro. Verifique os logs.');
    }
  },
};