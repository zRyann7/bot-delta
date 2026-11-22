const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { isStaff } = require('../utils/permissions');
const { criarModalAjuste } = require('../utils/ajusteModal');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ajustarhoras')
    .setDescription('Adiciona ou remove horas de um piloto')
    .setContexts(InteractionContextType.Guild),
  skipDefer: true,
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content: 'Acesso negado. Apenas a liderança Delta pode ajustar horas.',
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.showModal(criarModalAjuste());
  },
};
