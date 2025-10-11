import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";
import axios from "axios";
import * as cheerio from "cheerio";

export const commandBase = {
  prefixData: {
    name: "leaderboard",
    aliases: ["lb"],
  },
  slashData: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows current leaderboard.")
    .addStringOption((opt) =>
      opt
        .setName("period")
        .setDescription("Select one of the options.")
        .setRequired(true)
        .addChoices(
          { name: "Daily", value: "daily" },
          { name: "Weekly", value: "weekly" },
          { name: "Last 7 Days", value: "last_7_days" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("scope")
        .setDescription("Select one of the options.")
        .setRequired(true)
        .addChoices(
          { name: "Timezone", value: "timezone" },
          { name: "Regional", value: "regional" },
          { name: "Global", value: "global" }
        )
    ),
  cooldown: 5000,
  ownerOnly: false,

  async prefixRun(message, args) {
    const period = args[0]?.toLowerCase();
    const scope = args[1]?.toLowerCase();

    const validPeriods = ["daily", "weekly", "last_7_days"];
    const validScopes = ["timezone", "regional", "global"];

    if (!period || !validPeriods.includes(period))
      return message.channel.send(
        "Please provide a valid period: daily, weekly, last_7_days."
      );

    if (!scope || !validScopes.includes(scope))
      return message.channel.send(
        "Please provide a valid scope: timezone, regional, global."
      );

    const leaderboard_entries = await fetchLeaderboard(period, scope);
    const embed = buildEmbed(period, scope, leaderboard_entries);
    await message.channel.send({ embeds: [embed] });
  },

  async slashRun(interaction) {
    const period = interaction.options.getString("period")?.toLowerCase();
    const scope = interaction.options.getString("scope")?.toLowerCase();

    const validPeriods = ["daily", "weekly", "last_7_days"];
    const validScopes = ["timezone", "regional", "global"];

    if (!period || !validPeriods.includes(period))
      return interaction.editReply(
        "Please provide a valid period: daily, weekly, last_7_days."
      );

    if (!scope || !validScopes.includes(scope))
      return interaction.editReply(
        "Please provide a valid scope: timezone, regional, global."
      );

    await interaction.deferReply();
    const leaderboard_entries = await fetchLeaderboard(period, scope);
    const embed = buildEmbed(period, scope, leaderboard_entries);
    await interaction.editReply({ embeds: [embed] });
  },
};

async function fetchLeaderboard(period, scope) {
  const { data } = await axios.get(
    `https://hackatime.hackclub.com/leaderboards?period_type=${period}&scope=${scope}`
  );
  const $ = cheerio.load(data);

  const entries = [];
  $(
    "div.flex.items-center.p-2.hover\\:bg-dark.transition-colors.duration-200"
  ).each((i, el) => {
    const secondChild = $(el).children().eq(1);
    const thirdChild = $(el).children().eq(2);
    const firstInner = secondChild.children().first();
    const innerMost = firstInner.children().last();
    const imgSrc = innerMost.find("img").attr("src") || null;
    const name = innerMost.eq(0).find("span a").text().trim() || null;
    const profile_url = innerMost.eq(0).find("span a").attr("href") || null;
    const country = innerMost.eq(1).find("span").text().trim() || null;
    const time = thirdChild.text().trim() || null;

    if (imgSrc && name) {
      entries.push({
        img: imgSrc,
        name: name,
        profile_url: profile_url,
        country: country,
        time: time,
      });
    }
  });

  const count = await axios.get(
    `https://hackatime.hackclub.com/static_pages/currently_hacking_count`,
    {
      headers: {
        Authorization: "Bearer " + process.env.HACKATIME_API_KEY,
        Accept: "*/*",
      },
    }
  );

  return [entries.slice(0, 10), count.data.count || 0];
}

function buildEmbed(period, scope, entries) {
  const description = entries[0]
    .map((entry, index) => {
      return `**${index + 1}.** [${entry.name}](${entry.profile_url}) ${
        entry.country ? `:flag_${entry.country.toLowerCase()}:` : ""
      } - **${entry.time}**`;
    })
    .join("\n");

  return new EmbedBuilder()
    .setTitle(`${period} Leaderboard - ${scope}`)
    .setDescription(description)
    .setColor("Random")
    .setTimestamp()
    .setFooter({ text: `Currently hacking: ${entries[1]}` });
}
