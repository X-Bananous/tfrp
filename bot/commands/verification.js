import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUserAcceptedCharacters, getAllUserCharacters } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const verificationCommand = {
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Lancer la synchronisation du terminal'),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.user.id;
    const allChars = await getAllUserCharacters(userId);
    const acceptedChars = allChars.filter(c => c.status === 'accepted');

    const embed = new EmbedBuilder()
      .setTitle("Synchronisation du Terminal")
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription(`Analyse des dossiers pour <@${userId}>`);

    if (allChars.length === 0) {
      embed.addFields({ name: "Résultat", value: "Aucune fiche citoyenne détectée.", inline: false });
    } else {
      allChars.forEach(char => {
        const emoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
        embed.addFields({ 
          name: `${char.first_name} ${char.last_name}`, 
          value: `Statut : ${emoji} ${char.status.toUpperCase()}`, 
          inline: false 
        });
      });
    }

    if (acceptedChars.length > 0) {
       // Logic handleVerification v5 (attribution roles citoyens)
    }

    await interaction.editReply({ embeds: [embed] });
  }
};