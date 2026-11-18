const { EmbedBuilder } = require('discord.js');
const { getMembro, salvarMembro } = require('../../services/membroService');
const { registrarHistorico } = require('../../services/plantaoService');
const { formatarHoras, parseDataPlantao } = require('../../utils/formatters');
const { resolverMembro, enviarLog } = require('../../utils/discordHelpers');

module.exports = {
  name: 'fecharP',
  staffOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Uso correto: `!fecharP @usuario` ou `!fecharP <ID do Discord>`');
    }

    const alvoMembro = await resolverMembro(message, args[0]);
    if (!alvoMembro) {
      return message.reply('❌ Usuario nao encontrado. Mencione o membro (`@usuario`) ou informe o ID do Discord correto.');
    }

    try {
      const alvoUser = alvoMembro.user;
      const dados = await getMembro(alvoMembro.id);

      if (!dados.inicio_plantao) {
        return message.reply(`❌ <@${alvoMembro.id}> nao possui nenhum ponto aberto.`);
      }

      const inicio = parseDataPlantao(dados.inicio_plantao);
      const fim = new Date();
      const horasTrabalhadas = Math.max(0, (fim - inicio) / (1000 * 60 * 60));
      const novasHoras = dados.horas + horasTrabalhadas;

      await salvarMembro(alvoMembro.id, alvoUser.username, novasHoras, dados.acoes, null);
      await registrarHistorico(alvoMembro.id, alvoUser.username, dados.inicio_plantao, fim.toISOString(), horasTrabalhadas);

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('Ponto Fechado pela Liderança')
            .setDescription(`O ponto de <@${alvoMembro.id}> foi encerrado manualmente por <@${message.author.id}>.`)
            .addFields(
              { name: 'Abertura', value: `\`${inicio.toLocaleString('pt-BR')}\``, inline: true },
              { name: 'Fechamento', value: `\`${fim.toLocaleString('pt-BR')}\``, inline: true },
              { name: 'Duracao do plantao', value: `\`${formatarHoras(horasTrabalhadas)}\``, inline: false },
              { name: 'Saldo total de horas', value: `\`${formatarHoras(novasHoras)}\``, inline: true }
            )
            .setTimestamp(),
        ],
      });

      await enviarLog(
        message.guild,
        new EmbedBuilder()
          .setColor('#FEE75C')
          .setTitle('Ponto Encerrado Manualmente')
          .setDescription(
            `O ponto de <@${alvoMembro.id}> foi fechado pela liderança (<@${message.author.id}>).\n` +
            `Duracao registrada: \`${formatarHoras(horasTrabalhadas)}\``
          )
          .setTimestamp()
      );
    } catch (err) {
      console.error('Erro ao fechar ponto:', err);
      return message.reply('❌ Erro ao fechar o ponto. Verifique os logs.');
    }
  },
};