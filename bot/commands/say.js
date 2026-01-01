import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getProfile } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const sayCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faire parler le bot (Permission requise)')
    .addStringOption(opt => opt.setName('message').setDescription('Le texte à envoyer').setRequired(true))
    .addStringOption(opt => opt.setName('titre').setDescription('Titre (Transforme en Embed)'))
    .addStringOption(opt => opt.setName('description').setDescription('Description additionnelle (Transforme en Embed)'))
    .addAttachmentOption(opt => opt.setName('fichier').setDescription('Document joint')),

  async execute(interaction) {
    const profile = await getProfile(interaction.user.id);
    if (!profile?.permissions?.can_use_say) {
      return interaction.reply({ content: "Niveau d'accréditation insuffisant.", ephemeral: true });
    }

    const message = interaction.options.getString('message');
    const titre = interaction.options.getString('titre');
    const desc = interaction.options.getString('description');
    const file = interaction.options.getAttachment('fichier');

    if (titre || desc) {
      const embed = new EmbedBuilder()
        .setTitle(titre || "Annonce Officielle")
        .setDescription(`${message}${desc ? `\n\n${desc}` : ""}`)
        .setColor(BOT_CONFIG.EMBED_COLOR)
        .setFooter({ text: "TFRP • Transmission Gouvernementale" })
        .setTimestamp();
        
      await interaction.channel.send({ embeds: [embed], files: file ? [file] : [] });
    } else {
      await interaction.channel.send({ content: message, files: file ? [file] : [] });
    }

    await interaction.reply({ content: "Signal diffusé.", ephemeral: true });
  }
};