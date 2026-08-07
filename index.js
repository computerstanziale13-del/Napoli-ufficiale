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
    MessageFlags
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

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Il Bot di Italian Country RP è online e funzionante!');
});

app.listen(port, () => {
    console.log(`🌐 Server web in ascolto sulla porta ${port}`);
});

const TRANSCRIPT_CHANNEL_ID = '1532817281061752902';
const REVIEW_CHANNEL_ID = '1532817189412012245';
const SANCTION_ROLE_ID = '1518557087347638403';
const NEW_IMAGE_URL = 'https://cdn.discordapp.com/attachments/1530001472492933191/1534298026107994223/ChatGPT_Image_1_ago_2026_18_44_18.png?ex=6a739de3&is=6a724c63&hm=704cfa9ba489b0917266989715a2f5bcd4acb9d502f3dcb80414c681c9c2f058&';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

client.on('error', error => console.error('⚠️ Errore del client Discord:', error));
process.on('unhandledRejection', error => console.error('⚠️ Promessa non gestita:', error));

client.once('clientReady', async () => {
    console.log(`🤖 Bot avviato con successo come ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('setup-ticket')
            .setDescription('Invia il pannello dei ticket')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        new SlashCommandBuilder()
            .setName('sanzione')
            .setDescription('Apre il modulo per sanzionare un utente su Roblox'),
        new SlashCommandBuilder()
            .setName('aggiungi')
            .setDescription('Aggiungi un utente specifico a questo ticket')
            .addUserOption(option => 
                option.setName('utente')
                    .setDescription('Seleziona l\'utente da aggiungere')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('attesa')
            .setDescription('Imposta il ticket in attesa disabilitando l\'auto-chiusura')
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
        .setDescription(
            `🤝 **Benvenuto in Città, ${member.user.username}!**\n\n` +
            `Ciao ${member}, ti diamo il benvenuto ufficiale all'interno della community di **Italian Country RP**!\n\n` +
            `──────────────────────────`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
        .addFields(
            {
                name: '📝 SCHEDA ANAGRAFICA CITTADINO',
                value: `👤 **Nome Identificativo:** \`${member.user.username}\`\n` +
                       `🆔 **ID Discord Univoco:** \`${member.id}\`\n` +
                       `📊 **Registrazione Cittadini:** Sei il cittadino numero \`#${member.guild.memberCount}\``,
                inline: false
            },
            {
                name: '🛡️ VERIFICA SICUREZZA ACCOUNT',
                value: `📅 **Data Creazione Profilo:** <t:${createdTimestamp}:F>\n` +
                       `⏳ **Anzianità Account:** Il tuo profilo Discord è attivo da \`${accountAgeDays} giorni\`.\n` +
                       `⏰ **Immigrazione in Città:** <t:${joinedTimestamp}:F>\n\n` +
                       `──────────────────────────`,
                inline: false
            },
            {
                name: '🔗 GUIDA AI CANALI UTILI DA CONSULTARE',
                value: `• <#${regChannel}> — 📖 **Regolamento Ufficiale**\n` +
                       `• <#${annChannel}> — 📢 **Annunci Principali**\n` +
                       `• <#${partChannel}> — 🤝 **Canale Partnership**`,
                inline: false
            }
        )
        .setFooter({ text: 'Italian Country RP • Divertiti e rispetta le regole!' });

    await channel.send({ content: `🎉 **Un caloroso benvenuto a ${member}! Unisciti a noi!**`, embeds: [embed] });
});

/* ===================================================
   2. GESTIONE UNICA DELLE INTERAZIONI
   =================================================== */
client.on('interactionCreate', async interaction => {

    // --- 2.1 COMANDI SLASH ---
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'setup-ticket') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const descriptionText = 
`### Italian Country RP
## Sistema Supporto Ufficiale

<:gradi_alti:1524465497519685723> | **Italian Country RP — Sistema Ticket**

\`\`\`
( ✦ SUPPORTO UFFICIALE
Seleziona la categoria per ricevere
assistenza dal nostro staff. )
\`\`\`
\`\`\`
(──────────────────────────)
\`\`\`

<:gradi_alti:1524465497519685723>
\`\`\`
( | Assistenza Gradi Alti
> Priorità massima: blacklist, decisioni strategiche e questioni amministrative critiche. )
\`\`\`

<:game:1524465235014979604>
\`\`\`
( | Assistenza Game
> Supporto in-game, dubbi sul regolamento e segnalazioni urgenti. )
\`\`\`

<:partnership:1521589317854691504>
\`\`\`
( | Partnership
> Richieste di collaborazione ufficiale tra server. )
\`\`\`

<:bug:1524464370594222242>
\`\`\`
( | Bug Report
> Segnalazioni malfunzionamenti. Allegare sempre prove. )
\`\`\`

<:gestione:1524465990635884597>
\`\`\`
( | Gestione
> Reclami, contestazioni sanzioni e segnalazioni gravi. )
\`\`\`

\`\`\`
(──────────────────────────)
\`\`\`

👤 **Staff Disponibili**
🟢 \`10 Disponibili\`
👤 \`17 Totali\`

⏰ \`Italian Country RP | Sistema Ticket Ufficiale\`
**Italian Country RP — Supporto in Tempo Reale**`;

            const embed = new EmbedBuilder()
                .setDescription(descriptionText)
                .setThumbnail(NEW_IMAGE_URL)
                .setColor('#2B2D31');

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
                return interaction.reply({ content: '❌ Non hai il ruolo autorizzato per utilizzare questo comando!', flags: [MessageFlags.Ephemeral] });
            }

            const modal = new ModalBuilder().setCustomId('sanzione_modal').setTitle('Sanzione Utente Roblox');
            const usernameInput = new TextInputBuilder().setCustomId('roblox_username').setLabel('Nome utente Roblox').setStyle(TextInputStyle.Short).setRequired(true);
            const typeInput = new TextInputBuilder().setCustomId('sanzione_type').setLabel('Tipo di sanzione (Warn / Ban)').setStyle(TextInputStyle.Short).setRequired(true);
            const reasonInput = new TextInputBuilder().setCustomId('sanzione_reason').setLabel('Motivo').setStyle(TextInputStyle.Paragraph).setRequired(true);
            const durationInput = new TextInputBuilder().setCustomId('sanzione_duration').setLabel('Durata (es. Permanent, 7 Giorni)').setStyle(TextInputStyle.Short).setRequired(true);
            const proofInput = new TextInputBuilder().setCustomId('sanzione_proof').setLabel('Prove (Screenshot / Clip Link)').setStyle(TextInputStyle.Paragraph).setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(usernameInput),
                new ActionRowBuilder().addComponents(typeInput),
                new ActionRowBuilder().addComponents(reasonInput),
                new ActionRowBuilder().addComponents(durationInput),
                new ActionRowBuilder().addComponents(proofInput)
            );

            await interaction.showModal(modal);
            return;
        }

        if (interaction.commandName === 'aggiungi') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const staffRoleIdToUse = config.staffRoleId || process.env.STAFF_ROLE_ID;
            const isStaff = interaction.member && (interaction.member.roles.cache.has(staffRoleIdToUse) || interaction.member.permissions.has(PermissionFlagsBits.Administrator));

            if (!isStaff) {
                return await interaction.editReply({ content: '❌ Non hai i permessi di Staff per utilizzare questo comando!' });
            }

            const targetUser = interaction.options.getUser('utente');
            try {
                await interaction.channel.permissionOverwrites.edit(targetUser.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    AttachFiles: true
                });

                const addEmbed = new EmbedBuilder()
                    .setTitle('👤 UTENTE AGGIUNTO AL TICKET')
                    .setDescription(`L'utente ${targetUser} è stato aggiunto con successo a questo ticket da ${interaction.user}.`)
                    .setColor('#2ECC71')
                    .setTimestamp();

                await interaction.channel.send({ embeds: [addEmbed] });
                await interaction.editReply({ content: `✅ L'utente ${targetUser.tag} è stato aggiunto al canale.` });
            } catch (err) {
                console.error('Errore aggiunta utente al ticket:', err);
                await interaction.editReply({ content: '❌ Errore durante la modifica dei permessi.' });
            }
            return;
        }

        if (interaction.commandName === 'attesa') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const staffRoleIdToUse = config.staffRoleId || process.env.STAFF_ROLE_ID;
            const isStaff = interaction.member && (interaction.member.roles.cache.has(staffRoleIdToUse) || interaction.member.permissions.has(PermissionFlagsBits.Administrator));

            if (!isStaff) {
                return await interaction.editReply({ content: '❌ Non hai i permessi di Staff per utilizzare questo comando!' });
            }

            const currentTopic = interaction.channel.topic || '';
            const newTopic = currentTopic.includes('[In Attesa]') 
                ? currentTopic.replace('[In Attesa]', '').trim() 
                : `${currentTopic} [In Attesa]`.trim();

            await interaction.channel.setTopic(newTopic).catch(() => {});

            const attesaEmbed = new EmbedBuilder()
                .setTitle('⏳ TICKET IN ATTESA')
                .setDescription(`Questo ticket è stato contrassegnato come **In Attesa** da ${interaction.user}.\n\n📌 La chiusura automatica è stata disattivata fino a nuove disposizioni.`)
                .setColor('#F39C12')
                .setTimestamp();

            await interaction.channel.send({ embeds: [attesaEmbed] });
            await interaction.editReply({ content: '✅ Stato del ticket aggiornato con successo a "In Attesa".' });
            return;
        }
    }

    // --- 2.2 INVIO MODALE SANZIONI ---
    if (interaction.isModalSubmit() && interaction.customId === 'sanzione_modal') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const rbxUser = interaction.fields.getTextInputValue('roblox_username');
        const type = interaction.fields.getTextInputValue('sanzione_type');
        const reason = interaction.fields.getTextInputValue('sanzione_reason');
        const duration = interaction.fields.getTextInputValue('sanzione_duration');
        const proof = interaction.fields.getTextInputValue('sanzione_proof');

        let avatarUrl = '';
        try {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [rbxUser], excludeBannedUsers: false }, { timeout: 5000 });
            if (userRes.data.data.length > 0) {
                const userId = userRes.data.data[0].id;
                const headshotRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`, { timeout: 5000 });
                if (headshotRes.data.data.length > 0) avatarUrl = headshotRes.data.data[0].imageUrl;
            }
        } catch (e) {
            console.error('Errore avatar Roblox:', e.message);
        }

        const currentDate = new Date().toLocaleDateString('it-IT');
        const sanctionText = `╔══════════════════════════════╗\n📋 SANZIONE UTENTE\n╚══════════════════════════════╝\n\n👤 Nome utente: ${rbxUser}\n\n🔨 Tipo di sanzione: ${type}\n\n📌 Motivo: ${reason}\n\n⏳ Durata: ${duration}\n\n👮 Staff Responsabile: ${interaction.user}\n\n📅 Data: ${currentDate}\n\n📎 Prove: ${proof}`;

        const forumId = config.forumSanctionChannelId || process.env.FORUM_SANCTION_CHANNEL_ID;
        const forumChannel = interaction.guild.channels.cache.get(forumId);
        if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
            return interaction.editReply({ content: '❌ Canale Forum per le sanzioni non trovato.' });
        }

        const embed = new EmbedBuilder().setColor('#D32F2F').setDescription(sanctionText);
        if (avatarUrl) embed.setThumbnail(avatarUrl);

        await forumChannel.threads.create({ name: `Sanzione - ${rbxUser} [${type}]`, message: { embeds: [embed] } });
        await interaction.editReply({ content: '✅ Sanzione registrata con successo nel Forum!' });
        return;
    }

    // --- 2.3 SELEZIONE CATEGORIA TICKET (APERTURA ISTANTANEA E MESSAGGI DIVERSI) ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const selectedValue = interaction.values[0];
            const optionSelected = interaction.component.options.find(o => o.value === selectedValue);
            const categoryLabel = optionSelected ? optionSelected.label : 'Assistenza';

            const staffRoleIdToUse = config?.staffRoleId || process.env.STAFF_ROLE_ID;

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
            ];

            if (staffRoleIdToUse) {
                const staffRole = interaction.guild.roles.cache.get(staffRoleIdToUse);
                if (staffRole) {
                    permissionOverwrites.push({ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] });
                }
            }

            let categoryId = null;
            const catIdToUse = config?.ticketCategoryId || process.env.TICKET_CATEGORY_ID;
            if (catIdToUse) {
                const catChannel = interaction.guild.channels.cache.get(catIdToUse);
                if (catChannel && catChannel.type === ChannelType.GuildCategory) {
                    categoryId = catChannel.id;
                }
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `${selectedValue}-${interaction.user.username.toLowerCase()}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                permissionOverwrites: permissionOverwrites
            });

            let specificDescription = '';
            if (selectedValue === 'gradi-alti') {
                specificDescription = 'Hai aperto un ticket per **Assistenza Gradi Alti**. Si prega di esporre dettagliatamente la questione strategica o amministrativa. Uno dei responsabili risponderà a breve.';
            } else if (selectedValue === 'bug') {
                specificDescription = 'Hai aperto un ticket per **Segnalazione Bug**. Per favore, descrivi il malfunzionamento riscontrato e **allega screenshot o video** per permetterci di verificare.';
            } else if (selectedValue === 'game') {
                specificDescription = 'Hai aperto un ticket per **Assistenza Game**. Scrivi qui il tuo dubbio sul regolamento o il problema riscontrato in-game.';
            } else if (selectedValue === 'gestione') {
                specificDescription = 'Hai aperto un ticket di **Gestione**. Specifica chiaramente il motivo del reclamo o la contestazione della sanzione fornendo le prove.';
            } else if (selectedValue === 'partnership') {
                specificDescription = '🤝 **Richiesta Partnership avviata!**\n\nPer procedere con la valutazione, si prega di inviare:\n• **Requisiti rispettati** del vostro server\n• **Link d\'invito o ID del server** per visionare le statistiche.\n\nUno staffer interverrà al più presto.';
            } else {
                specificDescription = 'Spiega nel dettaglio la tua esigenza e attendi l\'arrivo dello staff.';
            }

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`🎫 Ticket: ${categoryLabel}`)
                .setDescription(`Benvenuto ${interaction.user}!\n\n${specificDescription}\n\nLo staff è stato avvisato e prenderà in carico la richiesta al più presto.`)
                .addFields(
                    { name: '📌 Categoria', value: `\`${categoryLabel}\``, inline: true },
                    { name: '👤 Utente', value: `${interaction.user}`, inline: true },
                    { name: '🛡️ Stato', value: '`In attesa di uno staffer`', inline: false }
                )
                .setColor('#3498DB');

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_claim').setLabel('Prendi in carico').setEmoji({ id: '1525053084261417067' }).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('ticket_release').setLabel('Rilascia').setEmoji({ id: '1524956959944474624' }).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('ticket_close').setLabel('Chiudi Ticket').setEmoji('🔒').setStyle(ButtonStyle.Secondary)
            );

            let pingContent = `${interaction.user}`;
            if (staffRoleIdToUse) {
                const staffRole = interaction.guild.roles.cache.get(staffRoleIdToUse);
                if (staffRole) {
                    pingContent = `<@&${staffRole.id}> | ${interaction.user}`;
                }
            }

            await ticketChannel.send({ content: pingContent, embeds: [ticketEmbed], components: [buttons] });
            await interaction.editReply({ content: `✅ Ticket creato correttamente: ${ticketChannel}` });

        } catch (error) {
            console.error('❌ Errore critico durante la creazione del ticket:', error);
            try {
                await interaction.editReply({ content: '❌ Si è verificato un errore durante la creazione del ticket. Controlla la console di Render per i dettagli.' });
            } catch (e) {}
        }
        return;
    }

    // --- 2.4 GESTIONE MODALE RECENSIONE ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('review_modal_')) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const staffId = interaction.customId.replace('review_modal_', '');
        const stars = interaction.fields.getTextInputValue('review_stars');
        const reason = interaction.fields.getTextInputValue('review_reason');

        const reviewChannel = interaction.client.channels.cache.get(REVIEW_CHANNEL_ID);
        if (reviewChannel) {
            const reviewEmbed = new EmbedBuilder()
                .setTitle('⭐ Nuova Recensione Ticket')
                .addFields(
                    { name: '👤 Utente', value: `${interaction.user}`, inline: true },
                    { name: '👮 Staffer', value: `<@${staffId}>`, inline: true },
                    { name: '⭐ Valutazione', value: `\`${stars} / 5\` ⭐`, inline: false },
                    { name: '💬 Motivazione', value: reason, inline: false }
                )
                .setColor('#F1C40F')
                .setTimestamp();

            await reviewChannel.send({ embeds: [reviewEmbed] }).catch(() => {});
        }

        await interaction.editReply({ content: '✅ Grazie mille! La tua recensione è stata inviata con successo.' });
        return;
    }

    // --- 2.5 PULSANTI DI GESTIONE TICKET ---
    if (interaction.isButton()) {
        const validActions = ['ticket_claim', 'ticket_release', 'ticket_close', 'review_accept', 'review_deny', 'ticket_acknowledge_close'];
        if (!validActions.includes(interaction.customId)) return;

        if (interaction.customId === 'review_accept' || interaction.customId === 'review_deny') {
            if (interaction.customId === 'review_deny') {
                return await interaction.update({ content: '❌ Richiesta di recensione rifiutata.', components: [] });
            }

            const embed = interaction.message.embeds[0];
            const staffField = embed.fields.find(f => f.name.includes('Staffer'));
            let staffId = '';
            if (staffField) {
                const match = staffField.value.match(/<@!?(\d+)>/);
                if (match) staffId = match[1];
            }

            const modal = new ModalBuilder()
                .setCustomId(`review_modal_${staffId || 'unknown'}`)
                .setTitle('Lascia una Recensione');

            const starsInput = new TextInputBuilder()
                .setCustomId('review_stars')
                .setLabel('Voto da 1 a 5 stelle')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(1);

            const reasonInput = new TextInputBuilder()
                .setCustomId('review_reason')
                .setLabel('Motivo / Commento')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(starsInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
            return;
        }

        if (interaction.customId === 'ticket_acknowledge_close') {
            await interaction.deferUpdate();
            await interaction.channel.send({ content: '🔒 Chiusura del ticket in corso e invio richiesta recensione...' });
            await chiudiTicketProcesso(interaction);
            return;
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const staffRoleIdToUse = config.staffRoleId || process.env.STAFF_ROLE_ID;
        const isStaff = interaction.member && (interaction.member.roles.cache.has(staffRoleIdToUse) || interaction.member.permissions.has(PermissionFlagsBits.Administrator));
        if (!isStaff) {
            return await interaction.editReply({ content: '❌ Non hai i permessi per gestire i ticket!' });
        }

        const topic = interaction.channel.topic || '';

        if (interaction.customId === 'ticket_claim') {
            if (topic.startsWith('Claimed:')) {
                return await interaction.editReply({ content: '⚠️ Questo ticket è già stato preso in carico!' });
            }

            await interaction.channel.setTopic(`Claimed: ${interaction.user.id}`).catch(() => {});
            await interaction.editReply({ content: '📌 Ticket preso in carico con successo!' });

            const claimEmbed = new EmbedBuilder()
                .setTitle('📌 TICKET PRESO IN CARICO')
                .setDescription(`Questo ticket è stato ufficialmente preso in carico da ${interaction.user}.\n\n⚠️ **Attenzione:** Da questo momento in poi, la gestione di questa chat è affidata esclusivamente a questo membro dello staff.`)
                .setColor('#2ECC71')
                .setTimestamp();

            await interaction.channel.send({ embeds: [claimEmbed] });
            return;
        }

        if (interaction.customId === 'ticket_release') {
            if (!topic.startsWith('Claimed:')) {
                return await interaction.editReply({ content: '⚠️ Questo ticket non è attualmente in carico a nessuno.' });
            }

            const currentClaimerId = topic.replace('Claimed: ', '').trim();
            if (interaction.user.id !== currentClaimerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.editReply({ content: `❌ Solo <@${currentClaimerId}> (o un Admin) può rilasciare questo ticket!` });
            }

            await interaction.channel.setTopic('').catch(() => {});
            await interaction.editReply({ content: '🔓 Ticket rilasciato con successo.' });

            const releaseEmbed = new EmbedBuilder()
                .setTitle('🔓 TICKET RILASCIATO')
                .setDescription(`Il ticket è stato rilasciato da ${interaction.user}.\n\nℹ️ **Informazione:** La chat è nuovamente disponibile per tutto lo staff.`)
                .setColor('#95A5A6')
                .setTimestamp();

            await interaction.channel.send({ embeds: [releaseEmbed] });
            return;
        }

        if (interaction.customId === 'ticket_close') {
            await interaction.editReply({ content: '⚠️ Richiesta di chiusura avviata. Controlla il messaggio nel canale.' });

            const warningEmbed = new EmbedBuilder()
                .setTitle('⚠️ AVVISO DI CHIUSURA TICKET')
                .setDescription(`Questo ticket sta per essere chiuso da ${interaction.user}.\n\nSi prega di prendere visione di tutte le informazioni fornite prima di procedere con l'archiviazione definitiva. Clicca sul pulsante sottostante per confermare la presa visione.`)
                .setColor('#E67E22')
                .setTimestamp();

            const ackButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_acknowledge_close').setLabel('Prendi visione').setStyle(ButtonStyle.Primary)
            );

            await interaction.channel.send({ embeds: [warningEmbed], components: [ackButton] });
            return;
        }
    }
});

async function chiudiTicketProcesso(interaction) {
    const topic = interaction.channel.topic || '';
    try {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const sortedMessages = Array.from(messages.values()).reverse();

        let ticketCreatorId = null;
        const firstMsg = sortedMessages.find(m => m.embeds.length > 0 && m.embeds[0].title?.startsWith('🎫 Ticket:'));
        if (firstMsg) {
            const userField = firstMsg.embeds[0].fields.find(f => f.name.includes('Utente'));
            if (userField) {
                const match = userField.value.match(/<@!?(\d+)>/);
                if (match) ticketCreatorId = match[1];
            }
        }

        let claimedStaffId = 'Nessuno';
        if (topic.startsWith('Claimed:')) {
            claimedStaffId = topic.replace('Claimed:', '').trim();
        }

        let transcriptText = `--- TRANSCRIPT TICKET: ${interaction.channel.name} ---\n`;
        transcriptText += `Chiuso da: ${interaction.user.tag} (${interaction.user.id})\n`;
        transcriptText += `Staffer Assegnato: ${claimedStaffId !== 'Nessuno' ? `<@${claimedStaffId}>` : 'Nessuno'}\n`;
        transcriptText += `Data: ${new Date().toLocaleString('it-IT')}\n`;
        transcriptText += `--------------------------------------------------------\n\n`;

        sortedMessages.forEach(msg => {
            const time = new Date(msg.createdTimestamp).toLocaleString('it-IT');
            transcriptText += `[${time}] ${msg.author.tag}: ${msg.content}\n`;
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(att => {
                    transcriptText += `    [Allegato: ${att.url}]\n`;
                });
            }
        });

        const buffer = Buffer.from(transcriptText, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { name: `transcript-${interaction.channel.name}.txt` });
        const transcriptChannel = interaction.guild.channels.cache.get(TRANSCRIPT_CHANNEL_ID);

        if (transcriptChannel) {
            const logEmbed = new EmbedBuilder()
                .setTitle(`📄 Transcript Ticket Chiuso`)
                .addFields(
                    { name: 'Canale', value: interaction.channel.name, inline: true },
                    { name: 'Chiuso da', value: `${interaction.user}`, inline: true },
                    { name: 'Staffer', value: claimedStaffId !== 'Nessuno' ? `<@${claimedStaffId}>` : 'Nessuno', inline: true }
                )
                .setColor('#E74C3C')
                .setTimestamp();

            await transcriptChannel.send({ embeds: [logEmbed], files: [attachment] }).catch(() => {});
        }

        if (ticketCreatorId) {
            try {
                const ticketUser = await interaction.client.users.fetch(ticketCreatorId);
                if (ticketUser) {
                    const reviewEmbed = new EmbedBuilder()
                        .setTitle('✨ Il tuo ticket è stato chiuso!')
                        .setDescription(`Il tuo ticket su **${interaction.guild.name}** è stato chiuso.\nTi va di lasciare una recensione per valutare il supporto ricevuto?`)
                        .addFields(
                            { name: '👮 Staffer Assegnato', value: claimedStaffId !== 'Nessuno' ? `<@${claimedStaffId}>` : 'Nessuno', inline: false }
                        )
                        .setColor('#3498DB')
                        .setFooter({ text: 'Clicca su Accetta per lasciare una valutazione.' });

                    const reviewButtons = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('review_accept').setLabel('Accetta').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('review_deny').setLabel('Rifiuta').setStyle(ButtonStyle.Danger)
                    );

                    await ticketUser.send({ embeds: [reviewEmbed], components: [reviewButtons] }).catch(() => {});
                }
            } catch (dmErr) {
                console.error('Impossibile inviare il DM all\'utente:', dmErr);
            }
        }

        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 3000);
    } catch (error) {
        console.error('Errore chiusura ticket:', error);
    }
}

const finalToken = process.env.TOKEN || config.token;
client.login(finalToken);
