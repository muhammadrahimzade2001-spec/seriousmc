const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = 'BURAYA_BOT_TOKENINI_YAZ';
const LOG_CHANNEL_ID = '1527656845911789709'; // İstediğin kanal

client.once('ready', () => {
    console.log(`${client.user.tag} aktif!`);
});

// Giriş - Çıkış Mesajları
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;
    channel.send(`Hoş geldin **${member.user.tag}**! Aramıza katıldığın için çok mutluyuz. ⚔️`);
});

client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;
    channel.send(`Görüşürüz **${member.user.tag}**, seni özleyeceğiz. 🛡️`);
});

// Temel Moderasyon Komutları
client.on('messageCreate', async message => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // !ban @kullanıcı
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('Yetkin yok!');
        const member = message.mentions.members.first();
        if (member) {
            await member.ban();
            message.channel.send(`${member.user.tag} sunucudan banlandı.`);
        }
    }

    // !mute @kullanıcı
    if (command === 'mute') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('Yetkin yok!');
        const member = message.mentions.members.first();
        // Not: Burada sunucunda 'Muted' isminde bir rol oluşturup ID'sini girmen gerekir
        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (member && muteRole) {
            await member.roles.add(muteRole);
            message.channel.send(`${member.user.tag} susturuldu.`);
        }
    }
});

client.login(process.env.TOKEN);
