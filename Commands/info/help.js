import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder } from "discord.js";

export const commandBase = {
  prefixData: {
    name: "help",
    aliases: ["h"],
  },
  slashData: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Info about all commands.")
    .addStringOption((opt) =>
      opt
        .setName("command")
        .setDescription("Show detailed info about a specific command.")
        .setRequired(false)
    ),
  cooldown: 5000,
  ownerOnly: false,

  async prefixRun(message, args) {
    const query = args[0];
    const client = message.client;
    const embed = buildHelpEmbed(client, query);
    await message.channel.send({ embeds: [embed] });
  },

  async slashRun(interaction) {
    const query = interaction.options.getString("command");
    const client = interaction.client;
    const embed = buildHelpEmbed(client, query);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

function buildHelpEmbed(client, query) {
  const embed = new EmbedBuilder().setColor("Random").setTimestamp();

  if (query) {
    const command =
      client.commands.get(query) ||
      client.slashCommands.get(query) ||
      client.commands.get(client.commandAliases.get(query));

    if (!command)
      return embed
        .setTitle("Help — Command Not Found")
        .setDescription(`No command named **${query}** was found.`);

    embed
      .setTitle(`Help — ${command.prefixData?.name || command.slashData?.name}`)
      .addFields(
        {
          name: "Description",
          value:
            command.slashData?.description ||
            command.prefixData?.description ||
            "No description.",
          inline: false,
        },
        {
          name: "Aliases",
          value: command.prefixData?.aliases?.length
            ? command.prefixData.aliases.join(", ")
            : "None",
          inline: false,
        },
        {
          name: "Cooldown",
          value: `${(command.cooldown || 0) / 1000}s`,
          inline: true,
        },
        {
          name: "Owner Only",
          value: command.ownerOnly ? "Yes" : "No",
          inline: true,
        }
      );
    return embed;
  }

  const prefixCommands = Array.from(client.commands.values()).map(
    (cmd) => `\`${cmd.prefixData.name}\``
  );
  const slashCommands = Array.from(client.slashCommands.values()).map(
    (cmd) => `\`/${cmd.slashData.name}\``
  );

  embed
    .setTitle("Help — Command List")
    .addFields(
      {
        name: "Prefix Commands",
        value: prefixCommands.join(", ") || "None",
      },
      {
        name: "Slash Commands",
        value: slashCommands.join(", ") || "None",
      }
    )
    .setFooter({ text: "Use /help <command> or !help <command> for details." });

  return embed;
}
