const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    PermissionFlagsBits, 
    ChannelType, 
    REST, 
    Routes,
    SlashCommandBuilder,
    AttachmentBuilder,
    MessageFlags // <-- AGGIUNTO QUESTO
} = require('discord.js');
const axios = require('axios');
const express = require('express');

let config;
try {
    config = require('./config.json');
} catch (e) {
    config = {
        token: process.env.TOKEN,
        welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
        staffRoleId: process.env.STAFF_ROLE_ID,
        ticketCategoryId: process.env.TICKET_CATEGORY_ID,
        forumSanctionChannelId: process.env.FORUM_SANCTION_CHANNEL_ID,
        channels: {
            regolamento: process.env.REGOLAMENTO_CHANNEL_ID,
            annunci: process.env.ANNUNCI_CHANNEL_ID,
            partnership: process.env.PARTNERSHIP_CHANNEL_ID
        }
    };
}

// --- SERVER EXPRESS PER L'HOSTING (RENDER) ---
const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
    res.send('Il Bot di Italian Country RP è online e funzionante!');
});

app.listen(port, () => {
    console.log(`🌐 Server web in ascolto sulla porta ${port}`);
});

const TRANSCRIPT_CHANNEL_ID = '1521562807051616448';
const REVIEW_CHANNEL_ID = '1527384115522044075';
const SANCTION_ROLE_ID = '1518557087347638403';
const NEW_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1531402756269805770/1531402786598682824/IMG_2695.png?ex=6a69157c&is=6a67c3fc&hm=b39a6f487454937505d86f1c7180b0d0bddaa16e3c3e1f603ed24951fc392345&';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.on('error', error => {
    console.error('⚠️ Errore del client Discord catturato:', error);
});

process.on('unhandledRejection', error => {
    console.error('⚠️ Promessa non gestita catturata:', error);
});

client.once('ready', async () => {
    console.log(`🤖 Bot avviato con successo come ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('setup-ticket')
            .setDescription('Invia il pannello dei ticket')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('sanzione')
            .setDescription('Apre il modulo per sanzionare un utente su Roblox')
    ];

    const tokenToUse = process.env.TOKEN || config.token;
    const rest = new REST({ version: '10' }).setToken(tokenToUse);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Comandi Slash registrati con successo!');
    } catch (err) {
        console.error('❌ Errore durante la registrazione dei comandi:', err);
    }
});

/* ===================================================
   1. MESSAGGIO DI BENVENUTO
   =================================================== */
client.on('guildMemberAdd', async member => {
    try {
        const channelId = config.welcomeChannelId || process.env.WELCOME_CHANNEL_ID;
        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
        const joinedTimestamp = Math.floor(member.joinedTimestamp / 1000);
        const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));

        const regChannel = config.channels?.regolamento || process.env.REGOLAMENTO_CHANNEL_ID;
        const annChannel = config.channels?.annunci || process.env.ANNUNCI_CHANNEL_ID;
        const partChannel = config.channels?.partnership || process.env.PARTNERSHIP_CHANNEL_ID;

        const embed = new EmbedBuilder()
            .setColor('#1E88E5')
            .setTitle(`✨ NUOVO CITTADINO — Benvenuto su Italian Country RP ✨`)
            .setDescription(`🤝 **Benvenuto in Città, ${member.user.username}!**\n\nCiao ${member}, ti diamo il benvenuto ufficiale all'interno della community di **Italian Country RP**!\n\n──────────────────────────`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .addFields(
                { name: '📝 SCHEDA ANAGRAFICA CITTADINO', value: `👤 **Nome Identificativo:** \`${member.user.username}\`\n🆔 **ID Discord Univoco:** \`${member.id}\`\n📊 **Registrazione Cittadini:** Sei il cittadino numero \`#${member.guild.memberCount}\``, inline: false },
                { name: '🛡️ VERIFICA SICUREZZA ACCOUNT', value: `📅 **Data Creazione Profilo:** <t:${createdTimestamp}:F>\n⏳ **Anzianità Account:** \`${accountAgeDays} giorni\`.\n⏰ **Immigrazione in Città:** <t:${joinedTimestamp}:F>`, inline: false },
                { name: '🔗 GUIDA AI CANALI UTILI', value: `• <#${regChannel}> — 📖 Regolamento\n• <#${annChannel}> — 📢 Annunci\n• <#${partChannel}> — 🤝 Partnership`, inline: false }
            )
            .setFooter({ text: 'Italian Country RP • Divertiti e rispetta le regole!' });

        await channel.send({ content: `🎉 **Un caloroso benvenuto a ${member}!**`, embeds: [embed] });
    } catch (e) {
        console.error("Errore nel messaggio di benvenuto:", e);
    }
});

/* ===================================================
   2. GESTIONE UNICA DELLE INTERAZIONI
   =================================================== */
client.on('interactionCreate', async interaction => {
    
    // --- 2.1 COMANDI SLASH ---
    if (interaction.isChatInputCommand()) {
        try {
            if (interaction.commandName === 'setup-ticket') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // FIX APPLICATO QUI
                const descriptionText = `### Italian Country RP\n## Sistema Supporto Ufficiale\nSeleziona la categoria per ricevere assistenza.`;
                const embed = new EmbedBuilder().setDescription(descriptionText).setThumbnail(NEW_IMAGE_URL).setColor('#2B2D31');

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('ticket_select')
                    .setPlaceholder('Seleziona la categoria del ticket...')
                    .addOptions([
                        { label: 'Assistenza Gradi Alti', value: 'gradi-alti', emoji: { id: '1524465497519685723' } },
                        { label: 'Segnalazione bug', value: 'bug', emoji: { id: '1524464370594222242' } },
                        { label: 'Assistenza Game', value: 'game', emoji: { id: '1524465235014979604' } },
                        { label: 'Gestione', value: 'gestione', emoji: { id: '1524465990635884597' } },
                        { label: 'Richiesta partnership', value: 'partnership', emoji: { id: '1521589317854691504' } }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);
                await interaction.channel.send({ embeds: [embed], components: [row] });
                await interaction.editReply({ content: '✅ Pannello ticket inviato con successo!' });
                return;
            }

            if (interaction.commandName === 'sanzione') {
                const hasRole = interaction.member.roles.cache.has(SANCTION_ROLE_ID);
                const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

                if (!hasRole && !isAdmin) {
                    return interaction.reply({ content: '❌ Non hai i permessi!', flags: MessageFlags.Ephemeral }); // FIX APPLICATO QUI
                }

                const modal = new ModalBuilder().setCustomId('sanzione_modal').setTitle('Sanzione Utente Roblox');
                modal.addComponents(
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('roblox_username').setLabel('Nome utente Roblox').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sanzione_type').setLabel('Tipo (Warn / Ban)').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sanzione_reason').setLabel('Motivo').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sanzione_duration').setLabel('Durata').setStyle(TextInputStyle.Short).setRequired(true)),
                    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sanzione_proof').setLabel('Prove (Link)').setStyle(TextInputStyle.Paragraph).setRequired(true))
                );

                await interaction.showModal(modal);
                return;
            }
        } catch (e) {
            console.error('Errore nel comando slash:', e);
        }
    }

    // --- 2.2 MODALI ---
    if (interaction.isModalSubmit()) {
        try {
            if (interaction.customId === 'sanzione_modal') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // FIX APPLICATO QUI
                const rbxUser = interaction.fields.getTextInputValue('roblox_username');
                const type = interaction.fields.getTextInputValue('sanzione_type');
                const reason = interaction.fields.getTextInputValue('sanzione_reason');
                const duration = interaction.fields.getTextInputValue('sanzione_duration');
                const proof = interaction.fields.getTextInputValue('sanzione_proof');

                let avatarUrl = '';
                try {
                    const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [rbxUser], excludeBannedUsers: false }, { timeout: 4000 });
                    if (userRes.data.data.length > 0) {
                        const userId = userRes.data.data[0].id;
                        const headshotRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`, { timeout: 4000 });
                        if (headshotRes.data.data.length > 0) avatarUrl = headshotRes.data.data[0].imageUrl;
                    }
                } catch (e) {
                    console.error('Errore avatar Roblox:', e.message);
                }

                const forumId = config.forumSanctionChannelId || process.env.FORUM_SANCTION_CHANNEL_ID;
                const forumChannel = interaction.guild.channels.cache.get(forumId);
                if (!forumChannel) return interaction.editReply({ content: '❌ Canale Forum non trovato.' });

                const embed = new EmbedBuilder().setColor('#D32F2F').setDescription(`👤 **Utente:** ${rbxUser}\n🔨 **Tipo:** ${type}\n📌 **Motivo:** ${reason}\n⏳ **Durata:** ${duration}\n👮 **Staff:** ${interaction.user}\n📎 **Prove:** ${proof}`);
                if (avatarUrl) embed.setThumbnail(avatarUrl);

                await forumChannel.threads.create({ name: `Sanzione - ${rbxUser} [${type}]`, message: { embeds: [embed] } });
                await interaction.editReply({ content: '✅ Sanzione registrata!' });
                return;
            }
        } catch (error) {
            console.error('Errore invio modale:', error);
            if (interaction.deferred) await interaction.editReply({ content: '❌ Si è verificato un errore durante l\'elaborazione del modulo.' });
        }
    }

    // --- 2.3 SELEZIONE TICKET ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // FIX APPLICATO QUI
        try {
            const selectedValue = interaction.values[0];
            const optionSelected = interaction.component.options.find(o => o.value === selectedValue);
            const categoryLabel = optionSelected ? optionSelected.label : 'Assistenza';

            const staffRoleIdToUse = config.staffRoleId || process.env.STAFF_ROLE_ID;
            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
            ];

            const staffRole = interaction.guild.roles.cache.get(staffRoleIdToUse);
            if (staffRole) {
                permissionOverwrites.push({ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] });
            }

            let categoryId = config.ticketCategoryId || process.env.TICKET_CATEGORY_ID;

            const ticketChannel = await interaction.guild.channels.create({
                name: `${selectedValue}-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: categoryId || null,
                permissionOverwrites: permissionOverwrites
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`🎫 Ticket: ${categoryLabel}`)
                .setDescription(`Benvenuto ${interaction.user}, uno staffer ti assisterà a breve.`)
                .setColor('#3498DB');

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_claim').setLabel('Prendi in carico').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ticket_release').setLabel('Rilascia').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('ticket_close').setLabel('Chiudi Ticket').setStyle(ButtonStyle.Danger)
            );

            const pingContent = staffRole ? `<@&${staffRole.id}> | ${interaction.user}` : `${interaction.user}`;
            await ticketChannel.send({ content: pingContent, embeds: [ticketEmbed], components: [buttons] });
            await interaction.editReply({ content: `✅ Ticket creato correttamente: ${ticketChannel}` });
        } catch (error) {
            console.error('ERRORE CREAZIONE TICKET:', error);
            await interaction.editReply({ content: `❌ Impossibile creare il ticket! Assicurati che il bot abbia i permessi di **Gestire i Canali** e che l'ID della categoria sia corretto.` });
        }
        return;
    }

    // --- 2.4 BOTTONI TICKET ---
    if (interaction.isButton()) {
        try {
            const validActions = ['ticket_claim', 'ticket_release', 'ticket_close', 'ticket_acknowledge_close'];
            if (!validActions.includes(interaction.customId)) return;

            if (interaction.customId === 'ticket_acknowledge_close') {
                await interaction.deferUpdate();
                await chiudiTicketProcesso(interaction);
                return;
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // FIX APPLICATO QUI
            
            const staffRoleIdToUse = config.staffRoleId || process.env.STAFF_ROLE_ID;
            const isStaff = interaction.member && (interaction.member.roles.cache.has(staffRoleIdToUse) || interaction.member.permissions.has(PermissionFlagsBits.Administrator));
            
            if (!isStaff) return await interaction.editReply({ content: '❌ Non hai i permessi per gestire questo ticket!' });

            const topic = interaction.channel.topic || '';

            if (interaction.customId === 'ticket_claim') {
                if (topic.startsWith('Claimed:')) return await interaction.editReply({ content: '⚠️ Questo ticket è già stato preso in carico!' });
                await interaction.channel.setTopic(`Claimed: ${interaction.user.id}`).catch(() => {});
                await interaction.editReply({ content: '📌 Ticket preso in carico con successo!' });
                await interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(`📌 Ticket preso in carico da ${interaction.user}`).setColor('#2ECC71')] });
                return;
            }

            if (interaction.customId === 'ticket_release') {
                if (!topic.startsWith('Claimed:')) return await interaction.editReply({ content: '⚠️ Questo ticket non è attualmente in carico a nessuno.' });
                await interaction.channel.setTopic('').catch(() => {});
                await interaction.editReply({ content: '🔓 Ticket rilasciato con successo.' });
                return;
            }

            if (interaction.customId === 'ticket_close') {
                await interaction.editReply({ content: '⚠️ Richiesta di chiusura avviata. Controlla il messaggio nel canale.' });
                const ackButton = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_acknowledge_close').setLabel('Conferma Chiusura Definitiva').setStyle(ButtonStyle.Danger)
                );
                await interaction.channel.send({ embeds: [new EmbedBuilder().setDescription(`Richiesta di chiusura da parte di ${interaction.user}\n\nClicca sul bottone per confermare e archiviare.`).setColor('#E67E22')], components: [ackButton] });
                return;
            }
        } catch (error) {
            console.error('Errore gestione bottone ticket:', error);
            if (interaction.deferred) await interaction.editReply({ content: '❌ Si è verificato un errore durante l\'azione.' });
        }
    }
});

// Funzione di chiusura sicura ottimizzata
async function chiudiTicketProcesso(interaction) {
    try {
        console.log(`[TICKET] Avviata chiusura canale: ${interaction.channel.name}`);
        
        const messages = await interaction.channel.messages.fetch({ limit: 50 }).catch(() => null);
        let transcriptText = `--- TRANSCRIPT: ${interaction.channel.name} ---\nChiuso da: ${interaction.user.tag}\n\n`;

        if (messages) {
            Array.from(messages.values()).reverse().forEach(msg => {
                transcriptText += `[${new Date(msg.createdTimestamp).toLocaleTimeString()}] ${msg.author.tag}: ${msg.content}\n`;
            });
        }

        const buffer = Buffer.from(transcriptText, 'utf-8');
        const safeChannelName = interaction.channel.name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${safeChannelName}.txt` });
        
        const transcriptChannel = interaction.guild.channels.cache.get(TRANSCRIPT_CHANNEL_ID);
        if (transcriptChannel) {
            await transcriptChannel.send({ content: `📄 Transcript del canale \`${interaction.channel.name}\``, files: [attachment] }).catch(() => {});
        }

        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 1500);

    } catch (error) {
        console.error('[TICKET] Errore critico chiusura:', error);
    }
}

const finalToken = process.env.TOKEN || config.token;
client.login(finalToken);
