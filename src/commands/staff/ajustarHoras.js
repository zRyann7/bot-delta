const { EmbedBuilder } = require('discord.js');
const { getMembro, salvarMembro } = require('../../services/membroService');
const { formatarHoras } = require('../../utils/formatters');
const { resolverMembro, enviarLog } = require('../../utils/discordHelpers');

module.exports = {
  name: 'ajustarHoras',
  staffOnly: true,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        'Use: `!ajustarHoras @usuario <valor>`\n' +
        'Exemplos:\n' +
        '  `!ajustarHoras @piloto 2` — adiciona 2 horas\n' +
        '  `!ajustarHoras @piloto -1.5` — remove 1h30\n' +
        '  `!ajustarHoras @piloto 0.5` — adiciona 30 minutos'
      );
    }

    const alvoMembro = await resolverMembro(message, args[0]);
    if (!alvoMembro) {
      return message.reply('❌ Usuario nao encontrado. Mencione o membro ou informe o ID correto.');
    }

    const horasArg = args[1];
    if (horasArg === undefined) {
      return message.reply('❌ Informe o valor de horas. Ex: `!ajustarHoras @piloto 2` ou `!ajustarHoras @piloto -1.5`');
    }

    const ajusteHoras = parseFloat(horasArg);
    if (isNaN(ajusteHoras) || ajusteHoras === 0) {
      return message.reply('❌ Valor invalido. Informe um numero diferente de zero, ex: `2`, `-1.5`, `0.5`.');
    }

    try {
      const alvoUser = alvoMembro.user;
      const dados = await getMembro(alvoMembro.id);

      const novasHoras = Math.max(0, (dados.horas || 0) + ajusteHoras);
      await salvarMembro(alvoMembro.id, alvoUser.username, novasHoras, dados.acoes, dados.inicio_plantao);

      const sinal = ajusteHoras > 0 ? '+' : '';
      const cor = ajusteHoras > 0 ? '#57F287' : '#ED4245';
      const acao = ajusteHoras > 0 ? 'Horas Adicionadas' : 'Horas Removidas';

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(cor)
            .setTitle(acao)
            .setDescription(
              `<@${alvoMembro.id}>\n` +
              `Ajuste: **${sinal}${formatarHoras(Math.abs(ajusteHoras))}**\n` +
              `Saldo total: **${formatarHoras(novasHoras)}**`
            ),
        ],
      });

      await enviarLog(
        message.guild,
        new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Horas Ajustadas Manualmente')
          .setDescription(
            `Piloto: <@${alvoMembro.id}>\n` +
            `Ajuste: **${sinal}${formatarHoras(Math.abs(ajusteHoras))}**\n` +
            `Saldo total: **${formatarHoras(novasHoras)}**\n` +
            `Registrado por <@${message.author.id}>.`
          )
          .setTimestamp()
      );
    } catch (err) {
      console.error('Erro ao ajustar horas:', err);
      return message.reply('❌ Erro ao ajustar as horas. Verifique se o usuario e valido.');
    }
  },
};