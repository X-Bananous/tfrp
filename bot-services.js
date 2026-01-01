import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActivityType
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getPendingCharactersCount, 
  getTotalCharactersCount,
  getAcceptedCharactersCount,
  supabase, 
  updateProfilePermissions,
  getNewValidations,
  getProfile
} from "./bot-db.js";

// État local pour la surcharge manuelle (Reset au redémarrage du bot)
let manualSSDOverride = null;

/**
 * Configure manuellement le statut du SSD
 * @param {string|null} status - 'fluide', 'perturbe', 'ralenti', 'nuit' ou null pour auto
 */
export function setManualSSD(status) {
  manualSSDOverride = status;
}

/**
 * Récupère le statut manuel actuel
 */
export function getManualSSD() {
  return manualSSDOverride;
}

/**
 * Calcul du statut SSD avec critères de volume ou override manuel
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  const totalCount = await getTotalCharactersCount();
  const acceptedCount = await getAcceptedCharactersCount();
  
  // Heure Paris (FR)
  const parisTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" });
  const hour = new Date(parisTime).getHours();
  
  const nowTimestamp = Math.floor(Date.now() / 1000);

  let statusLabel = "Fluide"; 
  let statusEmoji = "🟢";

  // LOGIQUE DE DÉCISION (Priorité à la surcharge manuelle)
  if (manualSSDOverride) {
    switch(manualSSDOverride) {
      case 'fluide': statusLabel = "Fluide (Manuel)"; statusEmoji = "🟢"; break;
      case 'perturbe': statusLabel = "Perturbé (Manuel)"; statusEmoji = "🟠"; break;
      case 'ralenti': statusLabel = "Ralenti (Manuel)"; statusEmoji = "🔴"; break;
      case 'nuit': statusLabel = "Mode Nuit (Manuel)"; statusEmoji = "⚫"; break;
    }
  } else {
    // Logique automatique
    if (hour >= 22 || hour < 8) {
      statusLabel = "Mode Nuit : Réponses peu probables"; 
      statusEmoji = "⚫";
    } else if (pendingCount > 50) {
      statusLabel = "Ralenti"; 
      statusEmoji = "🔴";
    } else if (pendingCount > 25) {
      statusLabel = "Perturbé"; 
      statusEmoji = "🟠";
    } else if (pendingCount > 0) {
      statusLabel = "Fluide / Fast Checking";
      statusEmoji = "🟢";
    } else {
      statusLabel = "En attente de flux";
      statusEmoji = "⚪";
    }
  }

  const embed = new EmbedBuilder()
    .setTitle("Statut des Services de Douanes (SSD)")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`État actuel : ${statusEmoji} **${statusLabel}**\n\n` +
      "⚫ **Mode Nuit / Interrompu** - Réponses peu probables.\n" +
      "🔴 **Ralenti** - Charge importante (>50 dossiers).\n" +
      "🟠 **Perturbé** - Charge modérée (>25 dossiers).\n" +
      "🟢 **Fluide** - Traitement normal ou rapide.\n" +
      "⚪ **En attente** - Aucun dossier dans la file.\n\n" +
      `*Dernière actualisation : <t:${nowTimestamp}:R>*`)
    .addFields(
      { name: "File d'attente", value: `**${pendingCount}** fiches`, inline: true },
      { name: "Total Dossiers", value: `**${totalCount}** fiches`, inline: true },
      { name: "Citoyens Validés", value: `**${acceptedCount}** fiches`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Douanes TFRP • Système de Monitoring" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('Actualiser').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row], emoji: statusEmoji, stats: { pendingCount, totalCount, acceptedCount } };
}

/**
 * Envoi des notifications pour les nouveaux personnages acceptés (MP + Salon Log + Rôles)
 */
export async function sendVerificationDMs(client) {
  const newChars = await getNewValidations();
  if (newChars.length === 0) return;

  // Grouper par utilisateur
  const userMap = {};
  for (const char of newChars) {
    if (!userMap[char.user_id]) userMap[char.user_id] = [];
    userMap[char.user_id].push(char);
  }

  const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
  const logChannel = await client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID).catch(() => null);

  for (const userId of Object.keys(userMap)) {
    try {
      const discordUser = await client.users.fetch(userId).catch(() => null);
      const chars = userMap[userId];
      const charIds = chars.map(c => c.id);
      
      const verifierId = chars[0].verifiedby;
      const staffProfile = verifierId ? await getProfile(verifierId) : null;
      const staffName = staffProfile ? staffProfile.username : "Administration";
      const timestamp = Math.floor(Date.now() / 1000);

      const embed = new EmbedBuilder()
        .setTitle("🎉 Dossier d'Immigration Validé")
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setDescription(`Bonne nouvelle <@${userId}>, vos titres de transport et d'identité sont prêts.`)
        .addFields(
          { 
            name: "Personnage(s) accepté(s)", 
            value: chars.map(c => `• **${c.first_name} ${c.last_name}** (${c.job || 'Sans emploi'})`).join('\n'), 
            inline: false 
          },
          { name: "Vérificateur", value: staffName, inline: true },
          { name: "Date", value: `<t:${timestamp}:f>`, inline: true }
        )
        .setFooter({ text: "TFRP • Services de l'Immigration" });

      // GESTION DES RÔLES DISCORD
      if (mainGuild) {
          const member = await mainGuild.members.fetch(userId).catch(() => null);
          if (member) {
              // Retrait du rôle Non-Vérifié
              if (member.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
                  await member.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(e => console.error("[Rôles] Échec retrait unverified:", e.message));
              }
              // Ajout des rôles Citoyens
              for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
                  if (!member.roles.cache.has(roleId)) {
                      await member.roles.add(roleId).catch(e => console.error("[Rôles] Échec ajout citoyen:", e.message));
                  }
              }
          }
      }

      // Envoi MP
      if (discordUser) {
        await discordUser.send({ embeds: [embed] }).catch(() => {
            console.log(`[Système] Impossible d'envoyer le MP à ${userId} (DM fermés)`);
        });
      }

      // Envoi Salon Log
      if (logChannel) {
        await logChannel.send({ content: `Notification de validation pour <@${userId}>`, embeds: [embed] });
      }

      // Marquer comme notifié en base
      await supabase
        .from('characters')
        .update({ is_notified: true })
        .in('id', charIds);

    } catch (e) {
      console.error(`[Système] Erreur lors de la notification pour ${userId}:`, e);
    }
  }
}

/**
 * Synchronisation bidirectionnelle DB <-> Discord
 */
export async function performGlobalSync(client) {
  const guild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
  if (!guild) return;

  try {
    const members = await guild.members.fetch();
    const { data: profiles } = await supabase.from('profiles').select('id, permissions');
    
    for (const [memberId, member] of members) {
      if (member.user.bot) continue;

      const profile = profiles?.find(p => p.id === memberId);
      const dbPerms = profile?.permissions || {};
      const currentRoles = member.roles.cache;
      let dbHasChanged = false;
      const newDbPerms = { ...dbPerms };

      for (const [permKey, roleId] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
        const hasRoleOnDiscord = currentRoles.has(roleId);
        const hasPermInDb = dbPerms[permKey] === true;

        if (hasRoleOnDiscord && !hasPermInDb) {
          newDbPerms[permKey] = true;
          dbHasChanged = true;
        } 
        else if (hasPermInDb && !hasRoleOnDiscord) {
          await member.roles.add(roleId).catch(() => {});
        }
      }

      if (dbHasChanged) {
        await updateProfilePermissions(memberId, newDbPerms);
      }
    }
  } catch (error) {
    console.error(`[Système] Erreur sync :`, error);
  }
}

/**
 * Mise à jour du statut d'activité du bot (Alternance gérée dans index.js)
 */
export async function updateCustomsStatus(client) {
  const components = await getSSDComponents();
  
  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("Douanes"));
    
    const { emoji, stats, ...payload } = components;
    if (botMsg) await botMsg.edit(payload);
    else await channel.send(payload);
  } catch (e) {}
  
  return components;
}

export async function handleUnverified(client, userId) {
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (!mainGuild) return;
    const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
    if (!mainMember) return;
    if (!mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
      await mainMember.roles.add(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
    }
  } catch (err) {}
}