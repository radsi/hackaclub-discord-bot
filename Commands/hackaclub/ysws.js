import { SlashCommandBuilder } from "@discordjs/builders";
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import axios from "axios";
import yaml from "js-yaml";

export const commandBase = {
  prefixData: { name: "ysws", aliases: ["jobs"] },
  slashData: new SlashCommandBuilder()
    .setName("ysws")
    .setDescription("YSWS available jobs"),
  cooldown: 5000,
  ownerOnly: false,

  async prefixRun(message, args) {
    const activeJobs = await fetchActiveJobs();
    if (!activeJobs.length)
      return message.channel.send("No active jobs found!");

    await sendPaginatedEmbed(message, activeJobs);
  },

  async slashRun(interaction) {
    const activeJobs = await fetchActiveJobs();
    if (!activeJobs.length)
      return interaction.followUp({
        content: "No active jobs found!",
        ephemeral: true,
      });

    await sendPaginatedEmbed(interaction, activeJobs);
  },
};

async function fetchActiveJobs() {
  try {
    const res = await axios.get("https://ysws.hackclub.com/data.yml");
    const data = yaml.load(res.data);
    return data.limitedTime.filter((job) => job.status === "active");
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function sendPaginatedEmbed(ctx, jobs) {
  const chunkedJobs = [];
  for (let i = 0; i < jobs.length; i += 3) {
    chunkedJobs.push(jobs.slice(i, i + 3));
  }

  const pages = chunkedJobs.map((jobGroup) => {
    const embed = new EmbedBuilder()
      .setTitle("YSWS Active Jobs")
      .setColor("Random")
      .setDescription(
        jobGroup
          .map((job) => {
            const deadline = job.deadline
              ? new Date(job.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A";
            return `**[${job.name}](${job.website})**\n${String(
              job.description || "No description"
            ).slice(0, 200)}...\nSlack: ${
              job.slackChannel || "N/A"
            }\nDeadline: ${deadline}`;
          })
          .join("\n\n")
      );
    return embed;
  });

  let currentPage = 0;
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("prev")
      .setLabel("◀️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("▶️")
      .setStyle(ButtonStyle.Primary)
  );

  const msg = await (ctx.reply
    ? ctx.reply({
        embeds: [pages[currentPage]],
        components: [row],
        fetchReply: true,
      })
    : ctx.channel.send({ embeds: [pages[currentPage]], components: [row] }));

  const collector = msg.createMessageComponentCollector({ time: 60000 });

  collector.on("collect", (i) => {
    if (i.user.id !== (ctx.user?.id || ctx.author.id))
      return i.reply({
        content: "You can't interact with this!",
        ephemeral: true,
      });

    if (i.customId === "next") currentPage = (currentPage + 1) % pages.length;
    if (i.customId === "prev")
      currentPage = (currentPage - 1 + pages.length) % pages.length;

    i.update({ embeds: [pages[currentPage]] });
  });

  collector.on("end", () => msg.edit({ components: [] }));
}
