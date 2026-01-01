import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { supabase } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const sanctionAnnulerCommand = {
  data: new SlashCommandBuilder()
    .setName('sanction-annuler')
    .setDescription('Annuler une sanction administrative par son ID')
    .addStringOption(opt => opt.setName('id').setDescription('ID de la sanction (visible sur le panel)').setRequired(true)),

  async execute(interaction) {
    const sanctionId = interaction.options.getString('id');
    
    // Récupérer la sanction pour vérifier l'auteur
    const { data: sanction, error: fetchError } = await supabase
        .from('sanctions')
        .select('*, target:profiles!sanctions_user_id_fkey(username)')
        .eq('id', sanctionId)
        .maybeSingle();

    if (fetchError || !sanction) {
        return interaction.reply({ content: "ID de sanction introuvable ou erreur de base de données.", ephemeral: true });
    }

    const isFounder = BOT_CONFIG.VERIFIED_ROLE_IDS.includes(interaction.user.id); // Simplification, à affiner selon bot-config
    const isAuthor = sanction.staff_id === interaction.user.id;

    if (!isAuthor && !isFounder) {
        return interaction.reply({ content: "❌ Action refusée : Seul l'émetteur de la sanction ou la Fondation peut l'annuler.", ephemeral: true });
    }

    const { error: deleteError } = await supabase
        .from('sanctions')
        .delete()
        .eq('id', sanctionId);

    if (deleteError) {
        return interaction.reply({ content: "Erreur lors de la suppression de la sanction.", ephemeral: true });
    }

    const logEmbed = new EmbedBuilder()
        .setTitle("🗑️ Sanction Révoquée")
        .setColor(0x00FF00)
        .addFields(
            { name: "Ancienne Cible", value: sanction.target?.username || sanction.user_id, inline: true },
            { name: "Révocateur", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Raison Initiale", value: sanction.reason, inline: false }
        )
        .setTimestamp();

    const logChannel = await interaction.client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID).catch(() => null);
    if (logChannel) await logChannel.send({ embeds: [logEmbed] });

    await interaction.reply({ content: `La sanction **#${sanctionId.substring(0,8)}** pour **${sanction.target?.username}** a été annulée avec succès.`, ephemeral: true });
  }
};
