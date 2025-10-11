import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";
import axios from "axios";

export const commandBase = {
  prefixData: {
    name: "trust",
    aliases: [],
  },
  slashData: new SlashCommandBuilder()
    .setName("trust")
    .setDescription("Shows provided Hackatime user trust factor.")
    .addStringOption((opt) =>
      opt
        .setName("username")
        .setDescription("The Hackatime username to check.")
        .setRequired(true)
    ),
  cooldown: 5000,
  ownerOnly: false,

  async prefixRun(message, args) {
    const username = args[0];
    if (!username)
      return message.channel.send("Please provide a Hackatime username.");

    const stats = await fetchStats(username);

    const embed = buildEmbed(username, stats);
    await message.channel.send({ embeds: [embed] });
  },

  async slashRun(interaction) {
    const username = interaction.options.getString("username");
    await interaction.deferReply();

    const stats = await fetchStats(username);

    const embed = buildEmbed(username, stats);
    await interaction.editReply({ embeds: [embed] });
  },
};

async function fetchStats(username) {
  try {
    const res = await axios.get(
      `https://hackatime.hackclub.com/api/v1/users/${username}/trust_factor`
    );
    return res.data;
  } catch {
    return null;
  }
}

function buildEmbed(username, stats) {
  return new EmbedBuilder()
    .setTitle(`Hackatime Trust for ${username}`)
    .setColor("Random")
    .addFields(
      {
        name: "Trust level",
        value: stats.trust_level || "N/A",
        inline: true,
      },
      {
        name: "Trust value",
        value: stats.trust_value || "N/A",
        inline: true,
      }
    )
    .setTimestamp();
}
