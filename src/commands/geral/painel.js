const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'painel',
  staffOnly: true,
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('Painel de Ponto - Unidade Delta')
      .setDescription(
        'Registre seu expediente pelos botões abaixo.\n\n' +
        '**Iniciar Ponto** abre o seu plantão.\n' +
        '**Finalizar Ponto** fecha o plantão e soma as horas.\n' +
        '**Meu Perfil** mostra suas horas e apreensões.\n\n' +
        'Finalize o ponto ao sair. Se esquecer, a liderança precisa fechar por você.'
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Unidade Delta' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_entrar').setLabel('Iniciar Ponto').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_sair').setLabel('Finalizar Ponto').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_perfil').setLabel('Meu Perfil').setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  },
};
