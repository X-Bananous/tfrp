import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getAllSanctions } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const sanctionsCommand = {
  data: new SlashCommandBuilder()
    .setName('sanctions')
    .setDescription('Consulter le registre des sanctions')
    .addUserOption(opt => opt.setName('cible').setDescription('L\'utilisateur à vérifier (laisser vide pour soi)')),

  async execute(interaction) {
    const target = interaction.options.getUser('cible') || interaction.user;
    const sanctions = await getAllSanctions(target.id);

    const embed = new EmbedBuilder()
      .setTitle(`Casier Administratif : ${target.username}`)
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription(sanctions.length === 0 ? "Aucun antécédent répertorié." : `Le registre contient **${sanctions.length}** entrée(s) pour ce citoyen.`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    if (sanctions.length > 0) {
      sanctions.slice(0, 10).forEach(s => {
        const date = new Date(s.created_at).toLocaleDateString('fr-FR');
        const typeEmoji = s.type === 'warn' ? '🟡' : s.type === 'mute' ? '🟠' : '🔴';
        const expiry = s.expires_at ? `Exp: ${new Date(s.expires_at).toLocaleDateString('fr-FR')}` : 'Définitif';
        
        embed.addFields({ 
          name: `${typeEmoji} ${s.type.toUpperCase()} - ${date}`, 
          value: `**Raison:** ${s.reason}\n**Statut:** ${expiry}`, 
          inline: false 
        });
      });
      
      if (sanctions.length > 10) {
        embed.setFooter({ text: "Plus de 10 sanctions... Consultez le panel staff pour l'historique complet." });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};