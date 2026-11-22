const { EmbedBuilder } = require('discord.js');
const { getTodosMembros } = require('../../services/membroService');
const { formatarHoras } = require('../../utils/formatters');

module.exports = {
  name: 'pontosRegistrados',
  staffOnly: true,
  async execute(message) {
    try {
      const membros = await getTodosMembros();

      if (!membros.length) {
        return message.reply('Nenhum membro registrado ainda.');
      }

      const linhas = membros.map((m) => `👤 <@${m.id}> — \`${formatarHoras(m.horas || 0)}\``);

      const campos = [];
      let bloco = '';
      for (const linha of linhas) {
        const candidato = bloco ? `${bloco}\n${linha}` : linha;
        if (candidato.length > 1000) {
          if (bloco) campos.push(bloco);
          bloco = linha;
        } else {
          bloco = candidato;
        }
      }
      if (bloco) campos.push(bloco);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📋 Pontos Registrados (${membros.length})`)
        .setFooter({ text: 'Unidade Delta · Total de horas por membro' })
        .setTimestamp();

      campos.slice(0, 25).forEach((valor, i) => {
        embed.addFields({
          name: campos.length > 1 ? `Membros (${i + 1}/${campos.length})` : 'Membros',
          value: valor,
        });
      });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao buscar pontos registrados:', err);
      return message.reply('❌ Erro ao buscar os pontos registrados. Verifique os logs.');
    }
  },
};  