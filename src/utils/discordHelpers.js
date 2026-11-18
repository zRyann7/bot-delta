const resolverMembro = async (message, arg) => {
  let alvoMembro = message.mentions.members.first();
  if (alvoMembro) return alvoMembro;

  if (!arg) return null;
  const idArg = arg.replace(/\D/g, '');
  if (!idArg) return null;

  try {
    return await message.guild.members.fetch(idArg);
  } catch {
    return null;
  }
};

const enviarLog = async (guild, embed) => {
  if (!guild || !process.env.ID_CANAL_LOGS) return;
  const canalLogs = guild.channels.cache.get(process.env.ID_CANAL_LOGS);
  if (canalLogs) {
    await canalLogs.send({ embeds: [embed] }).catch((err) => {
      console.error('Erro ao enviar embed no canal de logs:', err);
    });
  }
};

module.exports = { resolverMembro, enviarLog };