
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const panelCommand = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Obtenir le lien d\'accès au panel web'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Accès au Panel Citoyen")
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription("Cliquez sur le bouton ci-dessous pour accéder à votre interface de gestion TFRP.\n\n**Note :** Vous devrez vous authentifier via Discord sur le site.")
      .setFooter({ text: "Lien sécurisé TFRP" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Ouvrir le Panel')
        .setURL(BOT_CONFIG.SITE_URL)
        .setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
