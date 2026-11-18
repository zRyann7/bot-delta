const { EmbedBuilder } = require('discord.js');
const { getMembro } = require('../../services/membroService');
const { getUltimoPlantao } = require('../../services/plantaoService');
const { formatarHoras, parseDataPlantao } = require('../../utils/formatters');

module.exports = {
  customId: 'btn_perfil',
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    const [dados, ultimaDuracao] = await Promise.all([
      getMembro(userId),
      getUltimoPlantao(userId),
    ]);

    const status = dados.inicio_plantao ? 'Em Ponto' : 'Fora de Servico';

    let tempoAtual = 'Nenhum expediente ativo';
    if (dados.inicio_plantao) {
      const hAtual = Math.max(0, (new Date() - parseDataPlantao(dados.inicio_plantao)) / (1000 * 60 * 60));
      tempoAtual = `\`${formatarHoras(hAtual)}\``;
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`Perfil de Piloto - ${username}`)
          .addFields(
            { name: 'Status', value: status, inline: true },
            { name: 'Apreensoes', value: `\`${dados.acoes || 0}\``, inline: true },
            { name: 'Horas Totais', value: `\`${formatarHoras(dados.horas || 0)}\``, inline: false },
            { name: 'Ultimo Plantao', value: `\`${formatarHoras(ultimaDuracao || 0)}\``, inline: true },
            { name: 'Plantao Atual', value: tempoAtual, inline: true }
          )
          .setTimestamp(),
      ],
    });
  },
};