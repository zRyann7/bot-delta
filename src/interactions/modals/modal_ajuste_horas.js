const { isStaff } = require('../../utils/permissions');
const { parseDuracao } = require('../../utils/formatters');
const { aplicarAjuste } = require('../../services/ajusteService');

module.exports = {
  customId: 'modal_ajuste_horas',
  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.editReply('Acesso negado. Apenas a liderança Delta pode ajustar horas.');
    }

    const usuario = interaction.fields.getSelectedUsers('piloto')?.first();
    const acao = interaction.fields.getStringSelectValues('acao')[0];
    const tempoTexto = interaction.fields.getTextInputValue('tempo').trim();

    if (!usuario) return interaction.editReply('Selecione o piloto.');
    if (usuario.bot) return interaction.editReply('Esse usuário é um bot, escolha um piloto.');

    if (/^[+-]/.test(tempoTexto)) {
      return interaction.editReply('Não use + ou - no tempo. Escolha Adicionar ou Remover no campo Ação.');
    }

    const horas = parseDuracao(tempoTexto);
    if (horas === null || horas === 0) {
      return interaction.editReply('Tempo inválido. Use algo como `2`, `1h30`, `45m` ou `1:15`.');
    }

    const membro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!membro) return interaction.editReply('Não encontrei esse usuário no servidor.');

    const ajusteHoras = acao === 'rem' ? -Math.abs(horas) : Math.abs(horas);

    const embed = await aplicarAjuste({
      guild: interaction.guild,
      membro,
      ajusteHoras,
      executorId: interaction.user.id,
    });

    return interaction.editReply({ embeds: [embed] });
  },
};
