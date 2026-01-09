import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { BOT_CONFIG } from "../../bot-config.js";
import { getProfile } from "../../bot-db.js";

export const aideCommand = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Afficher la liste des commandes disponibles'),

  async execute(interaction) {
    const profile = await getProfile(interaction.user.id);
    const perms = profile?.permissions || {};

    const embed = new EmbedBuilder()
      .setTitle("Manuel d'utilisation TFRP")
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription("Voici les commandes auxquelles vous avez accès sur ce terminal.")
      .addFields(
        { name: "👤 Citoyen", value: "`/personnages` : Voir vos dossiers\n`/verification` : Synchroniser vos rôles\n`/panel` : Lien vers le site web\n`/sanctions` : Voir votre casier", inline: false },
        { name: "🛂 Douanes", value: "`/status` : Voir l'état actuel des services", inline: false }
      )
      .setTimestamp()
      .setFooter({ text: "TFRP Support Technique" });

    if (perms.can_use_say || perms.can_use_dm || perms.can_approve_characters || perms.can_warn) {
      let staffCmds = "`/say` : Faire parler le bot\n`/dm` : Envoyer un message privé\n`/sanctionner` : Appliquer une sanction";
      
      if (perms.can_approve_characters) {
        staffCmds += "\n`/ssd` : Déployer le terminal SSD\n`/ssd_config` : Forcer le statut SSD";
      }

      embed.addFields({ 
        name: "🛡️ Administration (Staff)", 
        value: staffCmds, 
        inline: false 
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};