require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, ActivityType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

// Load Config & Data
const config = JSON.parse(fs.readFileSync('./config.json'));
let mediaData = JSON.parse(fs.readFileSync('./media_channels.json'));
let textData = JSON.parse(fs.readFileSync('./text_channels.json'));
let afkData = {};

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

// Auto Thread, Reaction System, & AFK Reset
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // AFK Reset
  if (afkData[message.author.id]) {
    try { await message.member.setNickname(message.member.displayName.replace('[AFK] ', '')); } catch {}
    delete afkData[message.author.id];
    message.reply('✅ Status AFK lu udah gue hapus karena lu aktif lagi.');
  }

  // Cek mention user AFK
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

  const { commandName, options, member, guild, user, channel } = interaction;

  switch (commandName) {
    case 'mediachannel':
      {
        const mode = options.getString('mode');
        if (mode === 'on') {
          mediaData[channel.id] = true;
          fs.writeFileSync('./media_channels.json', JSON.stringify(mediaData, null, 2));
          await interaction.reply('✅ Media Mode diaktifkan di channel ini.');
        } else if (mode === 'off') {
          delete mediaData[channel.id];
          fs.writeFileSync('./media_channels.json', JSON.stringify(mediaData, null, 2));
          await interaction.reply('❌ Media Mode dinonaktifkan di channel ini.');
        }
      }
      break;

    case 'textchannel':
      {
        const mode = options.getString('mode');
        if (mode === 'on') {
          textData[channel.id] = true;
          fs.writeFileSync('./text_channels.json', JSON.stringify(textData, null, 2));
          await interaction.reply('✅ Text Mode diaktifkan di channel ini.');
        } else if (mode === 'off') {
          delete textData[channel.id];
          fs.writeFileSync('./text_channels.json', JSON.stringify(textData, null, 2));
          await interaction.reply('❌ Text Mode dinonaktifkan di channel ini.');
        }
      }
      break;

    case 'setstatus':
      {
        const ownerId = '1219604670054404188';
        if (user.id !== ownerId) {
          return interaction.reply({ content: '❌ Lu bukan owner, gak bisa ubah status bot!', ephemeral: true });
        }
        const activity = options.getString('activity');
        const text = options.getString('text');
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
      break;

    case 'afk':
      {
        const reason = options.getString('alasan') || 'Lagi AFK';
        afkData[user.id] = { reason };
        try { await member.setNickname(`[AFK] ${member.displayName}`); } catch {}
        await interaction.reply(`✅ Status AFK lu udah gue set: **${reason}**`);
      }
      break;

    case 'addrole':
      {
        const target = options.getMember('target');
        const role = options.getRole('role');

        if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          return interaction.reply({ content: '❌ Lu butuh permission **Manage Roles** buat pake command ini.', ephemeral: true });
        }
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          return interaction.reply({ content: '❌ Bot butuh permission **Manage Roles**.', ephemeral: true });
        }
        if (role.position >= guild.members.me.roles.highest.position) {
          return interaction.reply({ content: '❌ Role itu posisinya lebih tinggi dari bot.', ephemeral: true });
        }

        await target.roles.add(role).catch(() => {});
        await interaction.reply(`✅ Berhasil nambahin role ${role} ke ${target.user.tag}`);
      }
      break;

    case 'removerole':
      {
        const target = options.getMember('target');
        const role = options.getRole('role');

        if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          return interaction.reply({ content: '❌ Lu butuh permission **Manage Roles** buat pake command ini.', ephemeral: true });
        }
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          return interaction.reply({ content: '❌ Bot butuh permission **Manage Roles**.', ephemeral: true });
        }
        if (role.position >= guild.members.me.roles.highest.position) {
          return interaction.reply({ content: '❌ Role itu posisinya lebih tinggi dari bot.', ephemeral: true });
        }

        await target.roles.remove(role).catch(() => {});
        await interaction.reply(`✅ Berhasil ngilangin role ${role} dari ${target.user.tag}`);
      }
      break;

    case 'clear':
      {
        const amount = options.getInteger('jumlah');
        if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
          return interaction.reply({ content: '❌ Lu butuh permission **Manage Messages** buat pake command ini.', ephemeral: true });
        }
        if (!amount || amount <= 0 || amount > 100) {
          return interaction.reply({ content: '❌ Masukin jumlah antara 1 sampai 100!', ephemeral: true });
        }
        await channel.bulkDelete(amount, true).catch(() => {});
        await interaction.reply({ content: `✅ ${amount} pesan berhasil dihapus.`, ephemeral: true });
      }
      break;

    case 'ping':
      await interaction.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`);
      break;

    case 'say':
      {
        const text = options.getString('text');
        await interaction.reply({ content: '✅ Pesan berhasil dikirim.', ephemeral: true });
        await channel.send(text);
      }
      break;

    case 'help':
      {
        const embed = new EmbedBuilder()
          .setTitle('📜 Daftar Command')
          .setColor('Blue')
          .setDescription(`
**/addrole [target] [role]** - Tambahin role ke member
**/afk [alasan]** - Set status AFK
**/clear [jumlah]** - Hapus beberapa pesan
**/help** - Liat daftar command
**/mediachannel [on/off]** - Aktif/Nonaktif Media Only Mode
**/ping** - Cek latency bot
**/removerole [target] [role]** - Ngilangin role dari member
**/say [text]** - Kirim pesan sebagai bot
**/setstatus** - Ubah status bot (Owner Only)
**/textchannel [on/off]** - Aktif/Nonaktif Text Only Mode
          `)
          .setFooter({ text: 'GVK Bot' });

        await interaction.reply({ embeds: [embed] });
      }
      break;

    default:
      break;
  }
});

client.login(process.env.TOKEN);
