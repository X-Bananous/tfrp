import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getProfile } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const dmCommand = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Envoyer un MP via le bot (Permission requise)')
    .addUserOption(opt => opt.setName('cible').setDescription('Destinataire').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Texte principal').setRequired(true))
    .addStringOption(opt => opt.setName('titre').setDescription('Titre (Embed)'))
    .addStringOption(opt => opt.setName('description').setDescription('Description additionnelle (Embed)'))
    .addAttachmentOption(opt => opt.setName('fichier').setDescription('Fichier joint')),

  async execute(interaction) {
    const profile = await getProfile(interaction.user.id);
    if (!profile?.permissions?.can_use_dm) {
      return interaction.reply({ content: "Accès au canal privé refusé.", ephemeral: true });
    }

    const target = interaction.options.getUser('cible');
    const message = interaction.options.getString('message');
    const titre = interaction.options.getString('titre');
    const desc = interaction.options.getString('description');
    const file = interaction.options.getAttachment('fichier');

    try {
      if (titre || desc) {
        const embed = new EmbedBuilder()
          .setTitle(titre || "Communication Privée")
          .setDescription(`${message}${desc ? `\n\n${desc}` : ""}`)
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setFooter({ text: "TFRP • Message du Commandement" })
          .setTimestamp();
        await target.send({ embeds: [embed], files: file ? [file] : [] });
      } else {
        await target.send({ content: message, files: file ? [file] : [] });
      }
      await interaction.reply({ content: `Signal transmis à <@${target.id}>.`, ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: "Échec : Le citoyen a fermé ses communications privées.", ephemeral: true });
    }
  }
};