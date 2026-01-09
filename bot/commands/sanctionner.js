import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { createSanction, getProfile } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

const SANCTION_LOG_CHANNEL = "1445853902074281985";

export const sanctionnerCommand = {
  data: new SlashCommandBuilder()
    .setName('sanctionner')
    .setDescription('Appliquer une sanction administrative (Staff Uniquement)')
    .addUserOption(opt => opt.setName('cible').setDescription('Le citoyen à sanctionner').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('Nature de la sanction').setRequired(true)
      .addChoices(
        { name: 'Warn (Avertissement)', value: 'warn' },
        { name: 'Mute (Discord)', value: 'mute' },
        { name: 'Ban (Serveur/Panel/Jeu)', value: 'ban' }
      ))
    .addStringOption(opt => opt.setName('raison').setDescription('Motif précis de la sanction').setRequired(true))
    .addIntegerOption(opt => opt.setName('duree').setDescription('Durée en minutes (Laisser vide pour permanent/warn)'))
    .addBooleanOption(opt => opt.setName('afficher_nom').setDescription('Afficher votre nom au joueur dans le MP ? (Défaut: Non)')),

  async execute(interaction) {
    const staffProfile = await getProfile(interaction.user.id);
    const type = interaction.options.getString('type');
    const target = interaction.options.getUser('cible');
    const reason = interaction.options.getString('raison');
    const duration = interaction.options.getInteger('duree');
    const showName = interaction.options.getBoolean('afficher_nom') || false;

    // SÉCURITÉ 1 : AUTO-SANCTION
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "⚠️ Tentative d'auto-sanction détectée. Opération annulée.", ephemeral: true });
    }

    // SÉCURITÉ 2 : HIÉRARCHIE DES RÔLES
    const memberTarget = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (memberTarget) {
        const callerHighest = interaction.member.roles.highest.position;
        const targetHighest = memberTarget.roles.highest.position;

        if (targetHighest >= callerHighest && !staffProfile?.isFounder) {
            return interaction.reply({ content: "❌ Impossible de sanctionner ce membre : son rang hiérarchique est égal ou supérieur au vôtre.", ephemeral: true });
        }
    }

    // Verification des permissions via profil Supabase
    const perms = staffProfile?.permissions || {};
    let hasPerm = false;
    if (type === 'warn' && perms.can_warn) hasPerm = true;
    if (type === 'mute' && perms.can_mute) hasPerm = true;
    if (type === 'ban' && perms.can_ban) hasPerm = true;

    if (!hasPerm && !staffProfile?.isFounder) {
      return interaction.reply({ content: "Vous n'avez pas l'accréditation nécessaire pour ce type de sanction.", ephemeral: true });
    }

    const expires_at = duration ? new Date(Date.now() + duration * 60000).toISOString() : null;

    const { data: sanction, error } = await createSanction({
      user_id: target.id,
      staff_id: interaction.user.id,
      type,
      reason,
      expires_at
    });

    if (error) {
      return interaction.reply({ content: "Erreur lors de l'enregistrement de la sanction.", ephemeral: true });
    }

    // Actions Discord immédiates
    if (type === 'mute' && duration) {
      try {
        if (memberTarget) await memberTarget.timeout(duration * 60000, reason);
      } catch (e) { console.error("Echec timeout", e); }
    }

    // Notification DM
    const dmEmbed = new EmbedBuilder()
      .setTitle("⚠️ Notification de Sanction")
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription(`Vous avez reçu une sanction administrative sur **Team French Roleplay**.`)
      .addFields(
        { name: "Type", value: type.toUpperCase(), inline: true },
        { name: "Durée", value: duration ? `${duration} minutes` : "Permanente", inline: true },
        { name: "Raison", value: reason }
      );

    if (showName) {
      dmEmbed.addFields({ name: "Émis par", value: interaction.user.username, inline: true });
    }

    dmEmbed.setFooter({ text: "Vous pouvez contester cette sanction une fois par an via votre profil sur le panel." });

    await target.send({ embeds: [dmEmbed] }).catch(() => {});

    // Log public/admin
    const logEmbed = new EmbedBuilder()
      .setTitle("📋 Nouvelle Sanction")
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .addFields(
        { name: "Cible", value: `<@${target.id}> (${target.username})`, inline: true },
        { name: "Staff", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Type", value: type.toUpperCase(), inline: true },
        { name: "Raison", value: reason, inline: false },
        { name: "Fin", value: expires_at ? `<t:${Math.floor(new Date(expires_at).getTime() / 1000)}:R>` : "Définitif", inline: true }
      )
      .setTimestamp();

    const logChannel = await interaction.client.channels.fetch(SANCTION_LOG_CHANNEL).catch(() => null);
    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    }

    await interaction.reply({ content: `Sanction **${type.toUpperCase()}** appliquée avec succès à <@${target.id}>.`, ephemeral: true });
  }
};