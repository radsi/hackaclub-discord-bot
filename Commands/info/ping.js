import { SlashCommandBuilder } from "@discordjs/builders";

export const commandBase = {
  prefixData: {
    name: "ping",
    aliases: ["pong"],
  },
  slashData: new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
  cooldown: 5000,
  ownerOnly: false,
  async prefixRun(message, args) {
    message.reply("Pong 🏓");
  },
  async slashRun(interaction) {
    interaction.reply("Pong 🏓");
  },
};
