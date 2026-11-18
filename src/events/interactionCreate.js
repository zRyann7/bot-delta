module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const buttonHandler = client.buttons.get(interaction.customId);
    if (!buttonHandler) return;

    await interaction.deferReply({ ephemeral: true });

    try {
      await buttonHandler.execute(interaction, client);
    } catch (error) {
      console.error(`Erro no botao ${interaction.customId}:`, error);
      await interaction.editReply('Erro ao processar a requisicao. Tente novamente.');
    }
  },
};