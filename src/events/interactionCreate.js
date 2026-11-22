const { MessageFlags } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    let handler;
    if (interaction.isChatInputCommand()) {
      handler = client.slashCommands.get(interaction.commandName);
    } else if (interaction.isButton()) {
      handler = client.buttons.get(interaction.customId);
    } else if (interaction.isModalSubmit()) {
      handler = client.modals.get(interaction.customId);
    }
    if (!handler) return;

    const nome = interaction.commandName || interaction.customId;

    if (!handler.skipDefer) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }

    try {
      await handler.execute(interaction, client);
    } catch (error) {
      console.error(`Erro na interacao ${nome}:`, error);
      const aviso = 'Erro ao processar a requisicao. Tente novamente.';
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(aviso).catch(() => {});
      } else {
        await interaction.reply({ content: aviso, flags: MessageFlags.Ephemeral }).catch(() => {});
      }
    }
  },
};
