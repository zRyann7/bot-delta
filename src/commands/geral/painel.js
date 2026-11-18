const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'painel',
  staffOnly: false,
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('🚔 Unidade Delta - Central de Operações 🚔')
      .setDescription('Selecione uma das opcoes abaixo para gerenciar seu expediente .')
      .setColor('#5865F2')
      .setFooter({ text: 'Unidade Delta - Sistema de Ponto' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_entrar').setLabel('Iniciar Ponto').setEmoji('🟢').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_sair').setLabel('Finalizar Ponto').setEmoji('🔴').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_perfil').setLabel('Meu Perfil').setEmoji('📊').setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  },
};