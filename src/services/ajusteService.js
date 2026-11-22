const { EmbedBuilder } = require('discord.js');
const { getMembro, salvarMembro } = require('./membroService');
const { formatarHoras } = require('../utils/formatters');
const { enviarLog } = require('../utils/discordHelpers');

// Aplica o ajuste no banco, manda o log e devolve o embed de resposta.
// ajusteHoras: positivo adiciona, negativo remove (em horas decimais).
async function aplicarAjuste({ guild, membro, ajusteHoras, executorId }) {
  const dados = await getMembro(membro.id);

  const novasHoras = Math.max(0, (dados.horas || 0) + ajusteHoras);
  await salvarMembro(membro.id, membro.user.username, novasHoras, dados.acoes, dados.inicio_plantao);

  const sinal = ajusteHoras > 0 ? '+' : '';
  const adicionou = ajusteHoras > 0;
  const resumo =
    `Ajuste: **${sinal}${formatarHoras(Math.abs(ajusteHoras))}**\n` +
    `Saldo total: **${formatarHoras(novasHoras)}**`;

  await enviarLog(
    guild,
    new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Horas Ajustadas Manualmente')
      .setDescription(`Piloto: <@${membro.id}>\n${resumo}\nRegistrado por <@${executorId}>.`)
      .setTimestamp()
  );

  return new EmbedBuilder()
    .setColor(adicionou ? '#57F287' : '#ED4245')
    .setTitle(adicionou ? 'Horas Adicionadas' : 'Horas Removidas')
    .setDescription(`<@${membro.id}>\n${resumo}`);
}

module.exports = { aplicarAjuste };
