require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, ActivityType } = require('discord.js');
const fs = require('fs');

// Load Config & Data
const config = JSON.parse(fs.readFileSync('./config.json'));
let mediaData = JSON.parse(fs.readFileSync('./media_channels.json'));
let textData = JSON.parse(fs.readFileSync('./text_channels.json'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
});

// Auto Thread & Reaction System
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // Media Only Mode
  if (mediaData[message.channel.id]) {
    if (message.attachments.size > 0) {
      await message.react(config.mediaReaction);
      await message.startThread({ name: 'Media Thread', autoArchiveDuration: 60 });
    } else {
      await message.delete().catch(() => {});
      const warn = await message.channel.send(`${message.author}, hanya foto/video yang diizinkan di sini!`);
      setTimeout(() => warn.delete().catch(() => {}), 5000);
    }
    return;
  }

  // Text Only Mode
  if (textData[message.channel.id]) {
    if (message.attachments.size === 0) {
      await message.react(config.textReaction);
      await message.startThread({ name: 'Text Thread', autoArchiveDuration: 60 });
    } else {
      await message.delete().catch(() => {});
      const warn = await message.channel.send(`${message.author}, hanya teks yang diizinkan di sini!`);
      setTimeout(() => warn.delete().catch(() => {}), 5000);
    }
    return;
  }
});

// Slash Command Handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // /mediachannel on/off
  if (interaction.commandName === 'mediachannel') {
    const mode = interaction.options.getString('mode');
    if (mode === 'on') {
      mediaData[interaction.channel.id] = true;
      fs.writeFileSync('./media_channels.json', JSON.stringify(mediaData, null, 2));
      await interaction.reply('✅ Media Mode diaktifkan di channel ini.');
    } else if (mode === 'off') {
      delete mediaData[interaction.channel.id];
      fs.writeFileSync('./media_channels.json', JSON.stringify(mediaData, null, 2));
      await interaction.reply('❌ Media Mode dinonaktifkan di channel ini.');
    }
  }

  // /textchannel on/off
  if (interaction.commandName === 'textchannel') {
    const mode = interaction.options.getString('mode');
    if (mode === 'on') {
      textData[interaction.channel.id] = true;
      fs.writeFileSync('./text_channels.json', JSON.stringify(textData, null, 2));
      await interaction.reply('✅ Text Mode diaktifkan di channel ini.');
    } else if (mode === 'off') {
      delete textData[interaction.channel.id];
      fs.writeFileSync('./text_channels.json', JSON.stringify(textData, null, 2));
      await interaction.reply('❌ Text Mode dinonaktifkan di channel ini.');
    }
  }

// /setstatus (Hanya Owner yang bisa pakai)
if (interaction.commandName === 'setstatus') {
  const ownerId = '1219604670054404188'; // ID Discord lu
  if (interaction.user.id !== ownerId) {
    return interaction.reply({ content: '❌ Lu bukan owner, gak bisa ubah status bot!', ephemeral: true });
  }

  const activity = interaction.options.getString('activity');
  const text = interaction.options.getString('text');

  let type;
  switch (activity) {
    case 'playing': type = ActivityType.Playing; break;
    case 'watching': type = ActivityType.Watching; break;
    case 'listening': type = ActivityType.Listening; break;
    case 'streaming': type = ActivityType.Streaming; break;
    case 'competing': type = ActivityType.Competing; break;
    default: type = ActivityType.Playing;
  }

  client.user.setActivity(text, { type });
  await interaction.reply(`✅ Status bot diubah menjadi **${activity} ${text}**`);
}
});

client.login(process.env.TOKEN);
