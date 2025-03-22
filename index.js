require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

// Load Config & Data
const config = JSON.parse(fs.readFileSync('./config.json'));
let mediaData = JSON.parse(fs.readFileSync('./media_channels.json'));
let textData = JSON.parse(fs.readFileSync('./text_channels.json'));
let afkData = {}; // AFK data disimpan di memory, bisa lu simpen di file kalau mau

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

// Auto Thread & Reaction System + AFK Auto Reset
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // AFK Reset
  if (afkData[message.author.id]) {
    try {
      await message.member.setNickname(message.member.displayName.replace('[AFK] ', ''));
    } catch {}
    delete afkData[message.author.id];
    message.reply('✅ Status AFK lu udah gue hapus karena lu aktif lagi.');
  }

  // Cek kalo mention orang AFK
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(user => {
      if (afkData[user.id]) {
        message.channel.send(`${user.tag} lagi AFK: **${afkData[user.id].reason}**`);
      }
    });
  }

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

  // /mediachannel
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

  // /textchannel
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

  // /setstatus
  if (interaction.commandName === 'setstatus') {
    const ownerId = '1219604670054404188';
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
    await interaction.reply(`✅ Status bot diubah jadi **${activity} ${text}**`);
  }

  // /ping
  if (interaction.commandName === 'ping') {
    await interaction.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`);
  }

  // /help
  if (interaction.commandName === 'help') {
    const embed = new EmbedBuilder()
      .setTitle('📜 Daftar Command')
      .setColor('Blue')
      .setDescription(`
**/mediachannel [on/off]** - Aktif/Nonaktif Media Only Mode
**/textchannel [on/off]** - Aktif/Nonaktif Text Only Mode
**/setstatus** - Ubah status bot (Owner Only)
**/afk [alasan]** - Set AFK status
**/ping** - Cek latency bot
**/help** - Liat daftar command
      `)
      .setFooter({ text: 'GVK Bot' });

    await interaction.reply({ embeds: [embed] });
  }

  // /afk
  if (interaction.commandName === 'afk') {
    const reason = interaction.options.getString('alasan') || 'Lagi AFK';
    afkData[interaction.user.id] = { reason };

    try {
      await interaction.member.setNickname(`[AFK] ${interaction.member.displayName}`);
    } catch {}

    await interaction.reply(`✅ Status AFK lu udah gue set: **${reason}**`);
  }
});

client.login(process.env.TOKEN);
