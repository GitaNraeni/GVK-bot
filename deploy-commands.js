require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Tambah role ke user')
    .addUserOption(option => option.setName('target').setDescription('User yang mau dikasih role').setRequired(true))
    .addRoleOption(option => option.setName('role').setDescription('Role yang mau dikasih').setRequired(true)),

  new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set status AFK')
    .addStringOption(option => option.setName('alasan').setDescription('Masukkan alasan AFK').setRequired(false)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Hapus beberapa pesan di channel')
    .addIntegerOption(option => 
      option.setName('jumlah')
        .setDescription('Jumlah pesan yang mau dihapus (max 100)')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Liat daftar command bot'),

  new SlashCommandBuilder()
    .setName('mediachannel')
    .setDescription('Aktifkan/Nonaktifkan Media Only Mode')
    .addStringOption(option => option.setName('mode').setDescription('on/off').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Cek latency bot'),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Hapus role dari user')
    .addUserOption(option => option.setName('target').setDescription('User yang mau dihapus rolenya').setRequired(true))
    .addRoleOption(option => option.setName('role').setDescription('Role yang mau dihapus').setRequired(true)),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Buat bot kirim pesan')
    .addStringOption(option => option.setName('text').setDescription('Isi pesan').setRequired(true)),

  new SlashCommandBuilder()
    .setName('setstatus')
    .setDescription('Ubah status bot')
    .addStringOption(option => option.setName('activity').setDescription('Activity type').setRequired(true)
      .addChoices(
        { name: 'Playing', value: 'playing' },
        { name: 'Watching', value: 'watching' },
        { name: 'Listening', value: 'listening' },
        { name: 'Streaming', value: 'streaming' },
        { name: 'Competing', value: 'competing' }
      ))
    .addStringOption(option => option.setName('text').setDescription('Isi status').setRequired(true)),

  new SlashCommandBuilder()
    .setName('textchannel')
    .setDescription('Aktifkan/Nonaktifkan Text Only Mode')
    .addStringOption(option => option.setName('mode').setDescription('on/off').setRequired(true)),
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🚀 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands('1349536671359565884'), // Ganti Client ID bot lo
      { body: commands }
    );
    console.log('✅ Commands registered!');
  } catch (error) {
    console.error(error);
  }
})();
