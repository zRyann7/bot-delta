const { fecharTodosPontos } = require('../../services/plantaoService');

module.exports = {
  name: 'fecharTodosPontos',
  staffOnly: true,
  async execute(message) {
    const aviso = await message.reply('Fechando todos os pontos ativos, aguarde...');

    try {
      const resultado = await fecharTodosPontos(message.guild, message.author.id);

      if (resultado.total === 0) {
        return aviso.edit('✅ Ninguém está com ponto aberto.');
      }

      await aviso.edit(
        `✅ ${resultado.fechados.length} de ${resultado.total} ponto(s) fechado(s) com sucesso.` +
        (resultado.erros.length ? `\n⚠️ ${resultado.erros.length} erro(s) — verifique os logs.` : '')
      );
    } catch (err) {
      console.error('Erro ao fechar todos os pontos:', err);
      await aviso.edit('❌ Erro ao fechar os pontos. Verifique os logs.');
    }
  },
};