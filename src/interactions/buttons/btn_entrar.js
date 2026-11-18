const { EmbedBuilder } = require('discord.js');
const { getMembro, salvarMembro } = require('../../services/membroService');
const { formatarHoras } = require('../../utils/formatters');

module.exports = {
  customId: 'btn_entrar',
  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const dados = await getMembro(userId);

    if (dados.inicio_plantao) {
      const iniciou = new Date(dados.inicio_plantao).toLocaleString('pt-BR');
      return interaction.editReply(`Voce ja possui um expediente ativo desde \`${iniciou}\`.`);
    }

    const agora = new Date().toISOString();
    await salvarMembro(userId, username, dados.horas, dados.acoes, agora);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#57F287')
          .setTitle('Expediente Iniciado')
          .setDescription(`Bom trabalho, <@${userId}>! Seu ponto foi registrado.`)
          .addFields({ name: 'Horas acumuladas', value: `\`${formatarHoras(dados.horas)}\`` })
          .setTimestamp(),
      ],
    });
  },
};