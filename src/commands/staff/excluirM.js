module.exports = {
  name: 'excluirM',
  staffOnly: true,
  async execute(message, args) {
    const num = args.length ? Number(args[0]) : NaN;

    if (!args.length || !args[0] || !Number.isInteger(num) || num < 1 || num > 100) {
      return message.reply(
        'Uso incorreto. Exemplo:\n' +
        '`!excluirM 10` - apaga as ultimas 10 mensagens do canal (max. 100)'
      );
    }

    try {
      const fetched = await message.channel.messages.fetch({ limit: Math.min(num + 1, 100) });
      const limite14dias = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentes = [...fetched.values()].filter((m) => m.createdTimestamp > limite14dias);

      if (recentes.length === 0) {
        return message.reply('Nenhuma mensagem recente encontrada (o Discord so permite apagar mensagens com menos de 14 dias).');
      }

      const deletadas = await message.channel.bulkDelete(recentes, true);

      const aviso = await message.channel.send(
        `${deletadas.size - 1} mensagem(ns) excluida(s) por <@${message.author.id}>.`
      );
      setTimeout(() => aviso.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error('Erro ao apagar mensagens em massa:', err);
      message.reply('Nao foi possivel excluir. O bot precisa da permissao Gerenciar Mensagens no canal.').catch(() => {});
    }
  },
};