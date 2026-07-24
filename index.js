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
    AttachmentBuilder
} = require('discord.js');
const axios = require('axios');
const config = require('./config.json');

const TRANSCRIPT_CHANNEL_ID = '1521562807051616448';
const REVIEW_CHANNEL_ID = '1527384115522044075';
const SANCTION_ROLE_ID = '1518557087347638403';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
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

    const rest = new REST({ version: '10' }).setToken(config.token);
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
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    if (!channel) return;

    const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);
    const joinedTimestamp = Math.floor(member.joinedTimestamp / 1000);
    const accountAgeDays = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24));

    const embed = new EmbedBuilder()
        .setColor('#1E88E5')
        .setTitle(`✨ NUOVO CITTADINO — Benvenuto su Naples Italy Roleplay ✨`)
        .setDescription(
            `🤝 **Benvenuto in Città, ${member.user.username}!**\n\n` +
            `Ciao ${member}, ti diamo il benvenuto ufficiale all'interno della community di **Naples Italy Roleplay**! La tua presenza arricchisce la nostra visualizzazione. Sei pronto a forgiare il tuo destiny, avviare la tua attività o scalare i vertici delle forze dell'ordine? 🌟\n\n` +
            `Ci teniamo a ricordarti che siamo una community basata sul rispetto reciproco e sull'alta qualità delle dinamiche di gioco. Di seguito trovi una panoramica completa per integrarti al meglio all'interno della nostra isola felice.\n\n` +
            `──────────────────────────`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
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
                name: '🗺️ PRIMI PASSI E LINEE GUIDA ESSENZIALI',
                value: `Per evitare spiacenti sanzioni administrative o corporali durante le sessioni di gioco, ti invitiamo caldamente a seguire la scaletta d'inserimento:\n\n` +
                       `1️⃣ **Consulta i Documenti Civili:** La conoscenza delle regole è fondamentale per una convivenza civile e divertente.\n` +
                       `2️⃣ **Resta Aggiornato:** Attiva le notifiche sui canali principali per non perderti nessun annuncio da parte dei Gradi Alti.\n` +
                       `3️⃣ **Apri un Ticket se necessiti d'aiuto:** Lo staff è costantemente a tua disposizione nel centro d'assistenza dedicato.`,
                inline: false
            },
            {
                name: '🔗 GUIDA AI CANALI UTILI DA CONSULTARE',
                value: `• <#${config.channels.regolamento}> — 📖 **Regolamento Ufficiale** (Leggilo attentamente)\n` +
                       `• <#${config.channels.annunci}> — 📢 **Annunci Principali** (Aggiornamenti in tempo reale)\n` +
                       `• <#${config.channels.partnership}> — 🤝 **Canale Partnership** (Le nostre collaborazioni)\n\n` +
                       `*Ti auguriamo una permanenza indimenticabile e un Roleplay ricco di scene mozzafiato! Lo staff di Naples Italy Roleplay.*`,
                inline: false
            }
        )
        .setFooter({ text: 'Naples Italy Roleplay • Divertiti e rispetta le regole!' });

    await channel.send({ content: `🎉 **Un caloroso benvenuto a ${member}! Unisciti a noi!**`, embeds: [embed] });
});

/* ===================================================
   2. GESTIONE UNICA DELLE INTERAZIONI
   =================================================== */
client.on('interactionCreate', async interaction => {
    
    // --- 2.1 COMANDI SLASH ---
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'setup-ticket') {
            await interaction.deferReply({ ephemeral: true });

            const descriptionText = 
`### Naples Italy Roleplay
## Sistema Supporto Ufficiale

<:gradi_alti:1524465497519685723> | **Naples Italy Roleplay — Sistema Ticket**

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
> Richieste di collaborazione ufficiale tra server. (Includere info e requisiti). )
\`\`\`

<:bug:1524464370594222242>
\`\`\`
( | Bug Report
> Segnalazioni malfunzionamenti. (Allegare sempre prove/screenshot). )
\`\`\`

<:gestione:1524465990635884597>
\`\`\`
( | Gestione
> Reclami, contestazioni sanzioni e segnalazioni gravi. (Allegare ID e prove video). )
\`\`\`

\`\`\`
(──────────────────────────)
\`\`\`

👤 **Staff Disponibili**
🟢 \`10 Disponibili\`
👤 \`17 Totali\`

⏰ \`Naples Italy Roleplay | Sistema Ticket Ufficiale\`
**Naples Italy Roleplay — Supporto in Tempo Reale**`;

            const embed = new EmbedBuilder()
                .setDescription(descriptionText)
                .setThumbnail('https://cdn.discordapp.com/attachments/1529926893825036398/1529929076251295935/Screenshot_2026-07-23-01-27-36-576_com.discord-edit.jpg?ex=6a63b8fc&is=6a62677c&hm=01ff830a49a98363bbae6da6d28fd22899740d77c163533eff10aead05afb4b0&')
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
                return interaction.reply({ content: '❌ Non hai il ruolo autorizzato per utilizzare questo comando!', ephemeral: true });
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
    }

    // --- 2.2 INVIO MODALE SANZIONI ---
    if (interaction.isModalSubmit() && interaction.customId === 'sanzione_modal') {
        await interaction.deferReply({ ephemeral: true });

        const rbxUser = interaction.fields.getTextInputValue('roblox_username');
        const type = interaction.fields.getTextInputValue('sanzione_type');
        const reason = interaction.fields.getTextInputValue('sanzione_reason');
        const duration = interaction.fields.getTextInputValue('sanzione_duration');
        const proof = interaction.fields.getTextInputValue('sanzione_proof');

        let avatarUrl = '';
        try {
            const userRes = await axios.post('https://users.roblox.com/v1/usernames/users', { usernames: [rbxUser], excludeBannedUsers: false });
            if (userRes.data.data.length > 0) {
                const userId = userRes.data.data[0].id;
                const headshotRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
                if (headshotRes.data.data.length > 0) avatarUrl = headshotRes.data.data[0].imageUrl;
            }
        } catch (e) {
            console.error('Errore avatar Roblox:', e);
        }

        const currentDate = new Date().toLocaleDateString('it-IT');
        const sanctionText = `╔══════════════════════════════╗\n📋 SANZIONE UTENTE\n╚══════════════════════════════╝\n\n👤 Nome utente: ${rbxUser}\n\n🔨 Tipo di sanzione: ${type}\n\n📌 Motivo: ${reason}\n\n⏳ Durata: ${duration}\n\n👮 Staff Responsabile: ${interaction.user}\n\n📅 Data: ${currentDate}\n\n📎 Prove: ${proof}`;

        const forumChannel = interaction.guild.channels.cache.get(config.forumSanctionChannelId);
        if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
            return interaction.editReply({ content: '❌ Canale Forum per le sanzioni non trovato.' });
        }

        const embed = new EmbedBuilder().setColor('#D32F2F').setDescription(sanctionText);
        if (avatarUrl) embed.setThumbnail(avatarUrl);

        await forumChannel.threads.create({ name: `Sanzione - ${rbxUser} [${type}]`, message: { embeds: [embed] } });
        await interaction.editReply({ content: '✅ Sanzione registrata con successo nel Forum!' });
        return;
    }

    // --- 2.3 SELEZIONE CATEGORIA TICKET ---
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
        await interaction.deferReply({ ephemeral: true });

        const selectedValue = interaction.values[0];
        const optionSelected = interaction.component.options.find(o => o.value === selectedValue);
        const categoryLabel = optionSelected.label;

        const permissionOverwrites = [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
        ];

        const staffRole = interaction.guild.roles.cache.get(config.staffRoleId);
        if (staffRole) {
            permissionOverwrites.push({ id: staffRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] });
        }

        let categoryId = null;
        if (config.ticketCategoryId) {
            const catChannel = interaction.guild.channels.cache.get(config.ticketCategoryId);
            if (catChannel && catChannel.type === ChannelType.GuildCategory) categoryId = catChannel.id;
        }

        const ticketChannel = await interaction.guild.channels.create({
            name: `${selectedValue}-${interaction.user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: categoryId,
            permissionOverwrites: permissionOverwrites
        });

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 Ticket: ${categoryLabel}`)
            .setDescription(`Benvenuto ${interaction.user}, uno staffer prenderà in carico la tua richiesta a breve.\nSpiega nel dettaglio la tua esigenza.`)
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

        const pingContent = staffRole ? `<@&${staffRole.id}> | ${interaction.user}` : `${interaction.user}`;
        await ticketChannel.send({ content: pingContent, embeds: [ticketEmbed], components: [buttons] });
        await interaction.editReply({ content: `✅ Ticket creato correttamente: ${ticketChannel}` });
        return;
    }

    // --- 2.4 GESTIONE MODALE RECENSIONE ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith('review_modal_')) {
        await interaction.deferReply({ ephemeral: true });

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
        const validActions = ['ticket_claim', 'ticket_release', 'ticket_close', 'review_accept', 'review_deny'];
        if (!validActions.includes(interaction.customId)) return;

        // Gestione accettazione o rifiuto recensione dai DM
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
                .setLabel('Voto da 1 a 5 stelle') // Etichetta accorciata (< 45 caratteri)
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(1);

            const reasonInput = new TextInputBuilder()
                .setCustomId('review_reason')
                .setLabel('Motivo / Commento') // Etichetta accorciata (< 45 caratteri)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(starsInput),
                new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const isStaff = interaction.member && (interaction.member.roles.cache.has(config.staffRoleId) || interaction.member.permissions.has(PermissionFlagsBits.Administrator));
        if (!isStaff) {
            return await interaction.editReply({ content: '❌ Non hai i permessi per gestire i ticket!' });
        }

        const topic = interaction.channel.topic || '';

        // 1. PRENDI IN CARICO
        if (interaction.customId === 'ticket_claim') {
            if (topic.startsWith('Claimed:')) {
                return await interaction.editReply({ content: '⚠️ Questo ticket è già stato preso in carico!' });
            }

            await interaction.channel.setTopic(`Claimed: ${interaction.user.id}`).catch(() => {});
            return await interaction.editReply({ content: `📌 Ticket preso in carico con successo da ${interaction.user}!` });
        }

        // 2. RILASCIA
        if (interaction.customId === 'ticket_release') {
            if (!topic.startsWith('Claimed:')) {
                return await interaction.editReply({ content: '⚠️ Questo ticket non è attualmente in carico a nessuno.' });
            }

            const currentClaimerId = topic.replace('Claimed: ', '').trim();
            if (interaction.user.id !== currentClaimerId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.editReply({ content: `❌ Solo <@${currentClaimerId}> (o un Admin) può rilasciare questo ticket!` });
            }

            await interaction.channel.setTopic('').catch(() => {});
            return await interaction.editReply({ content: `🔓 Ticket rilasciato con successo da ${interaction.user}.` });
        }

        // 3. CHIUDI TICKET
        if (interaction.customId === 'ticket_close') {
            await interaction.editReply({ content: '🔒 Chiusura del ticket in corso e invio richiesta recensione...' });

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
                            transcriptText += `   [Allegato: ${att.url}]\n`;
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
                        console.error('Impossibile inviare il DM all\'utente per la recensione:', dmErr);
                    }
                }

                setTimeout(async () => {
                    await interaction.channel.delete().catch(() => {});
                }, 3000);
            } catch (error) {
                console.error('Errore chiusura ticket:', error);
            }
            return;
        }
    }
});

client.login(config.token);