import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";
import axios from "axios";

export const commandBase = {
  prefixData: {
    name: "stats",
    aliases: ["user"],
  },
  slashData: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Shows provided Hackatime user stats.")
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
    if (!isValidStats(stats))
      return message.channel.send("Couldn't get info for that user.");

    const today = await fetchToday(stats.user_id);
    const embed = buildEmbed(username, stats, today);
    await message.channel.send({ embeds: [embed] });
  },

  async slashRun(interaction) {
    const username = interaction.options.getString("username");
    await interaction.deferReply();

    const stats = await fetchStats(username);
    if (!isValidStats(stats))
      return interaction.editReply("Couldn't get info for that user.");

    const today = await fetchToday(stats.user_id);
    const embed = buildEmbed(username, stats, today);
    await interaction.editReply({ embeds: [embed] });
  },
};

async function fetchStats(username) {
  try {
    const res = await axios.get(
      `https://hackatime.hackclub.com/api/v1/users/${username}/stats`
    );
    return res.data?.data;
  } catch {
    return null;
  }
}

async function fetchToday(userId) {
  try {
    const res = await axios.get(
      `https://hackatime.hackclub.com/api/hackatime/v1/users/${userId}/statusbar/today`
    );
    return res.data?.data?.grand_total?.text || "No data for today";
  } catch {
    return "No data for today";
  }
}

function isValidStats(stats) {
  if (!stats) return false;
  if (!stats.user_id) return false;
  if (!stats.human_readable_total) return false;
  if (!Array.isArray(stats.languages)) return false;
  return true;
}

function buildEmbed(username, stats, today) {
  const topLangs = stats.languages
    .filter((l) => l.total_seconds > 0)
    .sort((a, b) => b.total_seconds - a.total_seconds)
    .slice(0, 5)
    .map((l) => `**${l.name}** — ${l.text} (${l.percent.toFixed(2)}%)`)
    .join("\n");

  return new EmbedBuilder()
    .setTitle(`Hackatime Stats for ${username}`)
    .setColor("Random")
    .addFields(
      {
        name: "Total Time",
        value: stats.human_readable_total || "N/A",
        inline: true,
      },
      {
        name: "Daily Average",
        value: stats.human_readable_daily_average || "N/A",
        inline: true,
      },
      {
        name: "Range",
        value: stats.human_readable_range || "N/A",
        inline: true,
      },
      {
        name: "Today's Coding Time",
        value: today || "No data for today",
        inline: true,
      },
      {
        name: "Top Languages",
        value: topLangs || "No languages recorded",
        inline: false,
      }
    )
    .setFooter({ text: `User ID: ${stats.user_id}` })
    .setTimestamp();
}
