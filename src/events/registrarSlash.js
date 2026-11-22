module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    const comandos = client.slashCommands.map((c) => c.data.toJSON());

    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.commands.set(comandos);
        console.log(`Slash commands registrados em ${guild.name} (${comandos.length})`);
      } catch (err) {
        console.error(
          `Nao foi possivel registrar os slash commands em ${guild.name}: ${err.message}. ` +
          'Se for "Missing Access", convide o bot de novo com o escopo applications.commands.'
        );
      }
    }
  },
};
