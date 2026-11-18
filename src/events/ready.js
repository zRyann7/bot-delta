module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Bot Unidade Delta online como ${client.user.tag}`);
  },
};