const { EmbedBuilder } = require('discord.js');
const { isStaff } = require('../utils/permissions');

const PREFIX = '!';

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // Dispara apenas quando o bot é mencionado diretamente (sem outros textos)
    const mentionRegex = new RegExp(`^<@!?${client.user.id}>$`);
    if (mentionRegex.test(message.content.trim())) {
      const member =
        message.member ||
        (await message.guild.members.fetch(message.author.id).catch(() => null));
      const userIsStaff = member ? isStaff(member) : false;

      const fields = [
        {
          name: 'Operação & Consulta',
          value: [
            '`!painel` • Abre o terminal interativo de ponto',
            '`!pontosRegistrados` • Exibe o total de horas da unidade',
          ].join('\n'),
          inline: false,
        },
        {
          name: 'Controles do Painel',
          value: [
            '**Iniciar Ponto** • Registra entrada no expediente',
            '**Finalizar Ponto** • Encerra o turno e salva as horas',
            '**Meu Perfil** • Consulta horas, apreensões e status',
          ].join('\n'),
          inline: false,
        },
      ];

      if (userIsStaff) {
        fields.push({
          name: 'Comandos da Liderança',
          value: [
            '`!pontos` • Lista pilotos com ponto ativo',
            '`!ultimosP @piloto` • Últimos 5 plantões do piloto',
            '`!ajustarHoras @piloto <valor>` • Adiciona ou remove horas',
            '`!fecharP @piloto | <ID>` • Encerra o ponto aberto de um piloto',
            '`!fecharTodosPontos` • Encerra todos os pontos ativos',
            '`!zerarDados @piloto | <ID>` • Zera horas e apreensões do membro',
            '`!zerarDados CONFIRMAR` • Zera dados de todos os membros',
            '`!removerMembro @piloto | <ID>` • Apaga o registro definitivamente',
            '`!excluirM <1-100>` • Apaga as últimas mensagens do canal',
          ].join('\n'),
          inline: false,
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#1E293B')
        .setAuthor({
          name: 'UNIDADE DELTA • CENTRAL DE COMANDOS',
          iconURL: client.user.displayAvatarURL(),
        })
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(
          'Sistema de controle de ponto e registro operacional.\n' +
            'Utilize os botões do painel ou os comandos abaixo via chat.'
        )
        .addFields(fields)
        .setFooter({
          text: userIsStaff
            ? 'Unidade Delta • Modo Liderança'
            : 'Unidade Delta • Sistema de Ponto',
        })
        .setTimestamp();

      return message
        .reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
        .catch(() => message.channel.send({ embeds: [embed] }).catch(() => {}));
    }

    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift();
    if (!commandName) return;

    const command = client.commands?.get(commandName.toLowerCase());
    if (!command) return;

    if (command.staffOnly) {
      const member =
        message.member ||
        (await message.guild.members.fetch(message.author.id).catch(() => null));

      if (!member || !isStaff(member)) {
        return message
          .reply({
            content: 'Acesso negado. Apenas a liderança Delta pode executar este comando.',
            allowedMentions: { repliedUser: false },
          })
          .catch(() => {});
      }
    }

    try {
      await command.execute(message, args, client);
    } catch (error) {
      console.error(`[Erro no comando !${commandName}]:`, error);
      await message
        .reply({
          content: 'Ocorreu um erro interno ao executar este comando.',
          allowedMentions: { repliedUser: false },
        })
        .catch(() => {});
    }
  },
};