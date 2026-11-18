const { EmbedBuilder } = require('discord.js');
const { getMembro, zerarMembro, zerarTodos } = require('../../services/membroService');
const { resolverMembro, enviarLog } = require('../../utils/discordHelpers');

module.exports = {
  name: 'zerarDados',
  staffOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '⚠️ Isso vai zerar horas e apreensões de **todos** os membros.\n' +
        'Para confirmar, envie: `!zerarDados CONFIRMAR`'
      );
    }

    if (args[0] === 'CONFIRMAR') {
      try {
        const total = await zerarTodos();

        const embed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('🗑️ Reset Geral Executado')
          .setDescription(
            `Horas e apreensões de **${total} membro(s)** foram zeradas.\n` +
            `Todos os pontos abertos também foram encerrados.`
          )
          .addFields({ name: 'Executado por', value: `<@${message.author.id}>`, inline: true })
          .setTimestamp();

        await message.reply({ embeds: [embed] });
        await enviarLog(message.guild, embed);
      } catch (err) {
        console.error('Erro ao zerar todos:', err);
        return message.reply('❌ Erro ao zerar os dados. Verifique os logs.');
      }
      return;
    }

    const alvoMembro = await resolverMembro(message, args[0]);
    if (!alvoMembro) {
      return message.reply('❌ Membro não encontrado. Mencione o usuário ou informe o ID correto.');
    }

    try {
      const dados = await getMembro(alvoMembro.id);
      if (!dados.username) {
        return message.reply(`❌ <@${alvoMembro.id}> não possui registros no banco de dados.`);
      }

      await zerarMembro(alvoMembro.id);

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🗑️ Dados Zerados')
        .setDescription(`Horas e apreensões de <@${alvoMembro.id}> foram zeradas.`)
        .addFields(
          { name: 'Membro', value: `<@${alvoMembro.id}>`, inline: true },
          { name: 'Executado por', value: `<@${message.author.id}>`, inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      await enviarLog(message.guild, embed);
    } catch (err) {
      console.error('Erro ao zerar membro:', err);
      return message.reply('❌ Erro ao zerar os dados. Verifique os logs.');
    }
  },
};