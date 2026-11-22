const { EmbedBuilder } = require('discord.js');
const { getMembro, salvarMembro } = require('../../services/membroService');
const { formatarHoras } = require('../../utils/formatters');

const usuariosProcessando = new Set();

module.exports = {
  customId: 'btn_entrar',
  async execute(interaction) {
    const userId = interaction.user.id;

    if (usuariosProcessando.has(userId)) {
      return interaction.editReply({
        content: 'Seu registro já está sendo processado. Aguarde um instante.',
      });
    }

    usuariosProcessando.add(userId);

    try {
      const username = interaction.user.username;
      const dados = await getMembro(userId);

      const horasAtuais = dados?.horas ?? 0;
      const acoesAtuais = dados?.acoes ?? 0;

      if (dados?.inicio_plantao) {
        const unixInicio = Math.floor(new Date(dados.inicio_plantao).getTime() / 1000);

        const embedAviso = new EmbedBuilder()
          .setColor('#F59E0B')
          .setAuthor({
            name: 'UNIDADE DELTA • REGISTRO NEGADO',
            iconURL: interaction.client.user.displayAvatarURL(),
          })
          .setDescription(
            `Você já possui um plantão ativo iniciado às <t:${unixInicio}:t> (<t:${unixInicio}:R>).`
          );

        return await interaction.editReply({ embeds: [embedAviso] });
      }

      const agoraDate = new Date();
      const agoraISO = agoraDate.toISOString();
      const unixAgora = Math.floor(agoraDate.getTime() / 1000);

      await salvarMembro(userId, username, horasAtuais, acoesAtuais, agoraISO);

      const embedEntrada = new EmbedBuilder()
        .setColor('#10B981')
        .setAuthor({
          name: 'UNIDADE DELTA • PONTO INICIADO',
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(`Piloto <@${userId}> entrou em QRV.`)
        .addFields(
          {
            name: 'Início do Turno',
            value: `<t:${unixAgora}:t> (<t:${unixAgora}:R>)`,
            inline: true,
          },
          {
            name: 'Horas Acumuladas',
            value: `\`${formatarHoras(horasAtuais)}\``,
            inline: true,
          }
        )
        .setFooter({ text: `ID Operacional: ${userId}` })
        .setTimestamp();

      return await interaction.editReply({ embeds: [embedEntrada] });
    } catch (error) {
      console.error(`[btn_entrar] Erro ao iniciar ponto de ${userId}:`, error);

      return await interaction.editReply({
        content: 'Não foi possível registrar sua entrada no momento. Tente novamente em alguns segundos.',
      });
    } finally {
      usuariosProcessando.delete(userId);
    }
  },
};