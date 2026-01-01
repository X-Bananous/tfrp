import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getProfile } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";
import { setManualSSD, updateCustomsStatus } from "../../bot-services.js";

export const ssdConfigCommand = {
  data: new SlashCommandBuilder()
    .setName('ssd_config')
    .setDescription('Configuration manuelle du terminal douanier (Staff Uniquement)')
    .addStringOption(opt => opt.setName('statut').setDescription('Forcer un état spécifique').setRequired(true)
      .addChoices(
        { name: '🟢 Fluide', value: 'fluide' },
        { name: '🟠 Perturbé', value: 'perturbe' },
        { name: '🔴 Ralenti', value: 'ralenti' },
        { name: '⚫ Mode Nuit', value: 'nuit' },
        { name: '🔄 Automatique (Calculé)', value: 'auto' }
      )),

  async execute(interaction, client) {
    const profile = await getProfile(interaction.user.id);
    
    // Permission requise : Pouvoir approuver des WL (Whitelist [PS])
    if (!profile?.permissions?.can_approve_characters && !BOT_CONFIG.VERIFIED_ROLE_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: "Niveau d'accréditation insuffisant pour modifier le SSD.", ephemeral: true });
    }

    const statusChoice = interaction.options.getString('statut');
    
    if (statusChoice === 'auto') {
      setManualSSD(null);
      await interaction.reply({ content: "Le SSD est repassé en mode **Automatique** (basé sur le volume de dossiers).", ephemeral: true });
    } else {
      setManualSSD(statusChoice);
      await interaction.reply({ content: `Le SSD est désormais forcé en mode **${statusChoice.toUpperCase()}**.`, ephemeral: true });
    }

    // Mise à jour immédiate du terminal
    await updateCustomsStatus(client);
  }
};