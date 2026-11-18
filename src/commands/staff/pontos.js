const { EmbedBuilder } = require('discord.js');
const { getPontosAbertos } = require('../../services/plantaoService');
const { formatarHoras, parseDataPlantao } = require('../../utils/formatters');

module.exports = {
  name: 'pontos',
  staffOnly: true,
  async execute(message) {
    try {
      const membros = await getPontosAbertos();

      if (!membros.length) {
        return message.reply('✅ Ninguém está com ponto aberto.');
      }

      const agora = new Date();
      const linhas = membros
        .map((m) => {
          const inicio = parseDataPlantao(m.inicio_plantao);
          const horasAtivo = Math.max(0, (agora - inicio) / (1000 * 60 * 60));
          return (
            `👤 <@${m.id}>\n` +
            `🕒 Aberto em: \`${inicio.toLocaleString('pt-BR')}\`\n` +
            `⏱️ Tempo ativo: \`${formatarHoras(horasAtivo)}\``
          );
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle(`📋 Pontos Abertos (${membros.length})`)
        .setDescription(linhas)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao buscar pontos abertos:', err);
      return message.reply('❌ Erro ao buscar pontos abertos. Verifique os logs.');
    }
  },
};