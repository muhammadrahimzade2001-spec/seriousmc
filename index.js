const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    PermissionsBitField,
    ActivityType
} = require('discord.js');

// ==================== AYARLAR ====================
const TOKEN = process.env.TOKEN; // .env dosyasından oku
const LOG_CHANNEL_ID = '1527656845911789709';
const PREFIX = '!';
const EMBED_COLOR = 0x5865F2;      // Discord mavisi
const SUCCESS_COLOR = 0x57F287;    // Yeşil
const ERROR_COLOR = 0xED4245;      // Kırmızı
const WARN_COLOR = 0xFEE75C;       // Sarı

// ==================== CLIENT ====================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ==================== HAZIR ====================
client.once('ready', () => {
    console.log(`✅ ${client.user.tag} aktif!`);
    console.log(`📡 ${client.guilds.cache.size} sunucuda hizmet veriyor.`);

    client.user.setPresence({
        activities: [{ name: `${PREFIX}yardim | Moderasyon`, type: ActivityType.Watching }],
        status: 'online'
    });
});

// ==================== GİRİŞ / ÇIKIŞ ====================
client.on('guildMemberAdd', member => {
    const channel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(SUCCESS_COLOR)
        .setTitle('🎉 Hoş Geldin!')
        .setDescription(`**${member.user.tag}** aramıza katıldı!\nSunucumuz artık **${member.guild.memberCount}** üye. ⚔️`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    channel.send({ embeds: [embed] }).catch(console.error);
});

client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(ERROR_COLOR)
        .setTitle('👋 Görüşürüz!')
        .setDescription(`**${member.user.tag}** sunucudan ayrıldı. 🛡️\nKalan üye: **${member.guild.memberCount}**`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    channel.send({ embeds: [embed] }).catch(console.error);
});

// ==================== KOMUTLAR ====================
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
        // -------- !yardim --------
        if (command === 'yardim' || command === 'help') {
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle('📖 Komut Listesi')
                .setDescription('Aşağıdaki komutları kullanabilirsin:')
                .addFields(
                    { name: '🛡️ Moderasyon', value: '`!ban` `!kick` `!mute` `!unmute` `!clear`' },
                    { name: 'ℹ️ Bilgi', value: '`!ping` `!avatar` `!userinfo` `!serverinfo`' }
                )
                .setFooter({ text: `Prefix: ${PREFIX}` })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // -------- !ping --------
        if (command === 'ping') {
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle('🏓 Pong!')
                .setDescription(`Gecikme: **${client.ws.ping}ms**`);
            return message.reply({ embeds: [embed] });
        }

        // -------- !ban --------
        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
                return errorEmbed(message, 'Bu komutu kullanmak için **Ban Members** yetkisi gerekli.');

            const target = message.mentions.members.first();
            if (!target) return errorEmbed(message, 'Bir kullanıcı etiketle. Örnek: `!ban @kullanıcı`');
            if (!target.bannable) return errorEmbed(message, 'Bu kullanıcıyı banlayamıyorum (rolü yüksek olabilir).');

            const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
            await target.ban({ reason });

            const embed = new EmbedBuilder()
                .setColor(SUCCESS_COLOR)
                .setTitle('🔨 Kullanıcı Banlandı')
                .addFields(
                    { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        // -------- !kick --------
        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
                return errorEmbed(message, 'Bu komut için **Kick Members** yetkisi gerekli.');

            const target = message.mentions.members.first();
            if (!target) return errorEmbed(message, 'Bir kullanıcı etiketle. Örnek: `!kick @kullanıcı`');
            if (!target.kickable) return errorEmbed(message, 'Bu kullanıcıyı atamıyorum.');

            const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';
            await target.kick(reason);

            const embed = new EmbedBuilder()
                .setColor(WARN_COLOR)
                .setTitle('👢 Kullanıcı Atıldı')
                .addFields(
                    { name: 'Kullanıcı', value: `${target.user.tag}`, inline: true },
                    { name: 'Yetkili', value: `${message.author.tag}`, inline: true },
                    { name: 'Sebep', value: reason }
                )
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        // -------- !mute --------
        if (command === 'mute') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
                return errorEmbed(message, 'Bu komut için **Manage Roles** yetkisi gerekli.');

            const target = message.mentions.members.first();
            if (!target) return errorEmbed(message, 'Bir kullanıcı etiketle.');

            const muteRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
            if (!muteRole) return errorEmbed(message, '`Muted` adında bir rol bulunamadı. Lütfen oluştur.');

            await target.roles.add(muteRole);

            const embed = new EmbedBuilder()
                .setColor(WARN_COLOR)
                .setTitle('🔇 Kullanıcı Susturuldu')
                .setDescription(`**${target.user.tag}** susturuldu.`)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        // -------- !unmute --------
        if (command === 'unmute') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
                return errorEmbed(message, 'Bu komut için **Manage Roles** yetkisi gerekli.');

            const target = message.mentions.members.first();
            if (!target) return errorEmbed(message, 'Bir kullanıcı etiketle.');

            const muteRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
            if (!muteRole || !target.roles.cache.has(muteRole.id))
                return errorEmbed(message, 'Bu kullanıcı zaten susturulmamış.');

            await target.roles.remove(muteRole);

            const embed = new EmbedBuilder()
                .setColor(SUCCESS_COLOR)
                .setTitle('🔊 Susturma Kaldırıldı')
                .setDescription(`**${target.user.tag}** artık konuşabilir.`)
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        // -------- !clear --------
        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
                return errorEmbed(message, 'Bu komut için **Manage Messages** yetkisi gerekli.');

            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100)
                return errorEmbed(message, '1-100 arasında bir sayı gir. Örnek: `!clear 20`');

            await message.channel.bulkDelete(amount, true);
            const msg = await message.channel.send({ embeds: [
                new EmbedBuilder()
                    .setColor(SUCCESS_COLOR)
                    .setDescription(`🧹 **${amount}** mesaj silindi.`)
            ]});

            setTimeout(() => msg.delete().catch(() => {}), 3000);
            return;
        }

        // -------- !avatar --------
        if (command === 'avatar') {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle(`🖼️ ${user.tag} Avatarı`)
                .setImage(user.displayAvatarURL({ size: 512, dynamic: true }));
            return message.reply({ embeds: [embed] });
        }

        // -------- !userinfo --------
        if (command === 'userinfo') {
            const member = message.mentions.members.first() || message.member;
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle(`👤 ${member.user.tag}`)
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'ID', value: member.id, inline: true },
                    { name: 'Takma Ad', value: member.nickname || 'Yok', inline: true },
                    { name: 'Hesap Oluşturma', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Sunucuya Katılma', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Roller', value: member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.toString()).join(', ') || 'Yok' }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        // -------- !serverinfo --------
        if (command === 'serverinfo') {
            const g = message.guild;
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle(`🏰 ${g.name}`)
                .setThumbnail(g.iconURL({ dynamic: true }))
                .addFields(
                    { name: 'Sunucu Sahibi', value: `<@${g.ownerId}>`, inline: true },
                    { name: 'Üye Sayısı', value: `${g.memberCount}`, inline: true },
                    { name: 'Oluşturulma', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
                    { name: 'Kanal Sayısı', value: `${g.channels.cache.size}`, inline: true },
                    { name: 'Rol Sayısı', value: `${g.roles.cache.size}`, inline: true }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

    } catch (err) {
        console.error('Komut hatası:', err);
        errorEmbed(message, 'Bir hata oluştu. Lütfen daha sonra tekrar dene.');
    }
});

// ==================== YARDIMCI FONKSİYON ====================
function errorEmbed(message, text) {
    const embed = new EmbedBuilder()
        .setColor(ERROR_COLOR)
        .setTitle('❌ Hata')
        .setDescription(text);
    return message.reply({ embeds: [embed] });
}

// ==================== HATA YAKALAMA ====================
process.on('unhandledRejection', err => console.error('Yakalanmayan hata:', err));
process.on('uncaughtException', err => console.error('Beklenmeyen hata:', err));

client.login(TOKEN);
