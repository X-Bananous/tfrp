import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getSSDComponents } from "../../bot-services.js";

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Vérifier l\'état des services de douane'),

  async execute(interaction) {
    const components = await getSSDComponents();
    return interaction.reply({ embeds: components.embeds, components: components.components, ephemeral: true });
  }
};

export const ssdDeployCommand = {
  data: new SlashCommandBuilder()
    .setName('ssd')
    .setDescription('Déployer le terminal SSD (Staff uniquement)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const components = await getSSDComponents();
    await interaction.channel.send({ embeds: components.embeds, components: components.components });
    return interaction.reply({ content: "Terminal douanier déployé avec succès.", ephemeral: true });
  }
};