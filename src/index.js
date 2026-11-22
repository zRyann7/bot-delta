require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.slashCommands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(commandsPath)) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.statSync(folderPath).isDirectory()) continue;

  for (const file of fs.readdirSync(folderPath).filter((f) => f.endsWith('.js'))) {
    const command = require(path.join(folderPath, file));
    if (command.name && command.execute) {
      client.commands.set(command.name.toLowerCase(), command);
    }
  }
}

const buttonsPath = path.join(__dirname, 'interactions', 'buttons');
for (const file of fs.readdirSync(buttonsPath).filter((f) => f.endsWith('.js'))) {
  const button = require(path.join(buttonsPath, file));
  if (button.customId && button.execute) {
    client.buttons.set(button.customId, button);
  }
}

const slashPath = path.join(__dirname, 'slashCommands');
if (fs.existsSync(slashPath)) {
  for (const file of fs.readdirSync(slashPath).filter((f) => f.endsWith('.js'))) {
    const slash = require(path.join(slashPath, file));
    if (slash.data && slash.execute) {
      client.slashCommands.set(slash.data.name, slash);
    }
  }
}

const modalsPath = path.join(__dirname, 'interactions', 'modals');
if (fs.existsSync(modalsPath)) {
  for (const file of fs.readdirSync(modalsPath).filter((f) => f.endsWith('.js'))) {
    const modal = require(path.join(modalsPath, file));
    if (modal.customId && modal.execute) {
      client.modals.set(modal.customId, modal);
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.TOKEN);