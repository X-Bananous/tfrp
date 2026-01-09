import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getAllUserCharacters, getCharacterById } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const personnagesCommand = {
  data: new SlashCommandBuilder()
    .setName('personnages')
    .setDescription('Consulter les dossiers citoyens')
    .addUserOption(opt => opt.setName('cible').setDescription('Le citoyen à consulter (laisser vide pour soi)')),

  async execute(interaction, isUpdate = false) {
    const targetUser = interaction.options?.getUser('cible') || interaction.user;
    const allChars = await getAllUserCharacters(targetUser.id);
    
    const embed = new EmbedBuilder()
      .setTitle(`Terminal Citoyen : ${targetUser.username}`)
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription(`Consultation des archives pour <@${targetUser.id}>.\nVeuillez sélectionner une fiche ci-dessous pour voir les détails.`);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_char_manage')
      .setPlaceholder('Sélectionner un dossier');

    if (allChars.length > 0) {
      allChars.forEach(char => {
        selectMenu.addOptions(new StringSelectMenuOptionBuilder()
          .setLabel(`${char.first_name} ${char.last_name}`)
          .setDescription(`Statut : ${char.status.toUpperCase()}`)
          .setValue(char.id)
        );
      });
    } else {
      selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel("Aucune donnée").setValue("none").setDisabled(true));
    }

    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    const payload = { embeds: [embed], components: [row], ephemeral: true };
    
    if (isUpdate) {
        await interaction.editReply(payload);
    } else {
        await interaction.reply(payload);
    }
  }
};

export async function handlePersonnagesSelect(interaction) {
  await interaction.deferUpdate();
  const char = await getCharacterById(interaction.values[0]);
  if (!char) return;

  const statusEmoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
  const alignLabel = char.alignment === 'illegal' ? 'Clandestinité (Criminel)' : 'Secteur Civil (Légal)';
  const barLabel = char.bar_passed ? '✅ Accrédité (Barreau)' : '❌ Non accrédité';

  const embed = new EmbedBuilder()
    .setTitle(`Dossier : ${char.first_name} ${char.last_name}`)
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .addFields(
      { name: "Prénom & Nom", value: `${char.first_name} ${char.last_name}`, inline: false },
      { name: "Âge", value: `${char.age} ans`, inline: false },
      { name: "Date de naissance", value: `${new Date(char.birth_date).toLocaleDateString('fr-FR')}`, inline: false },
      { name: "Lieu de naissance", value: `${char.birth_place || 'Non renseigné'}`, inline: false },
      { name: "Orientation sociale", value: alignLabel, inline: false },
      { name: "Profession actuelle", value: char.job ? char.job.toUpperCase() : "SANS EMPLOI", inline: false },
      { name: "Points de permis", value: `${char.driver_license_points ?? 12} / 12`, inline: false },
      { name: "Licence de droit", value: barLabel, inline: false },
      { name: "Statut administratif", value: `${statusEmoji} ${char.status.toUpperCase()}`, inline: false }
    )
    .setFooter({ text: "Transmission TFRP • Terminal Sécurisé • v6.3" });

  const row = new ActionRowBuilder();
  
  // Bouton de retour
  const backBtn = new ButtonBuilder()
    .setCustomId('btn_back_to_list')
    .setLabel('Retour à la liste')
    .setStyle(ButtonStyle.Secondary);

  row.addComponents(backBtn);

  // Sécurité : Cliquable QUE si accepté ou refusé ET que l'utilisateur est le proprio
  if (char.user_id === interaction.user.id && char.status !== 'pending') {
    const linkBtn = new ButtonBuilder()
      .setLabel('Modifier sur le Panel')
      .setURL(BOT_CONFIG.SITE_URL)
      .setStyle(ButtonStyle.Link);
    
    row.addComponents(linkBtn);
  }

  await interaction.editReply({ embeds: [embed], components: [row] });
}