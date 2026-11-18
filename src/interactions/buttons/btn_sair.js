const { EmbedBuilder } = require('discord.js');
const { getMembro, salvarMembro } = require('../../services/membroService');
const { registrarHistorico } = require('../../services/plantaoService');
const { formatarHoras, parseDataPlantao } = require('../../utils/formatters');

module.exports = {
  customId: 'btn_sair',
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const dados = await getMembro(userId);

    if (!dados.inicio_plantao) {
      return interaction.editReply('Voce nao possui um ponto ativo para finalizar.');
    }

    const inicio = parseDataPlantao(dados.inicio_plantao);
    const fim = new Date();
    const horasTrabalhadas = Math.max(0, (fim - inicio) / (1000 * 60 * 60));
    const novasHoras = dados.horas + horasTrabalhadas;

    await salvarMembro(userId, username, novasHoras, dados.acoes, null);
    await registrarHistorico(userId, username, dados.inicio_plantao, fim.toISOString(), horasTrabalhadas);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('Expediente Finalizado')
          .setDescription(`Descanse bem, <@${userId}>!`)
          .addFields(
            { name: 'Duracao deste plantao', value: `\`${formatarHoras(horasTrabalhadas)}\``, inline: true },
            { name: 'Saldo total de horas', value: `\`${formatarHoras(novasHoras)}\``, inline: true }
          )
          .setTimestamp(),
      ],
    });
  },
};