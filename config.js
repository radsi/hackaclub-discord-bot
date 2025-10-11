const { GatewayIntentBits } = require("discord.js");

const config = {
  admins: [],

  support: [],

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ["CHANNEL"],

  defaultSettings: {
    prefix: "~",
    modLogChannel: "mod-log",
    modRole: "Moderator",
    adminRole: "Administrator",
    systemNotice: "true",
    commandReply: "true",
    welcomeChannel: "welcome",
    welcomeMessage:
      "Say hello to {{user}}, everyone! We all need a warm welcome sometimes :D",
    welcomeEnabled: "false",
  },

  permLevels: [
    { level: 0, name: "User", check: () => true },

    {
      level: 2,
      name: "Moderator",
      check: (message) => {
        try {
          const modRole = message.guild.roles.cache.find(
            (r) =>
              r.name.toLowerCase() === message.settings.modRole.toLowerCase()
          );
          if (modRole && message.member.roles.cache.has(modRole.id))
            return true;
        } catch (e) {
          return false;
        }
      },
    },

    {
      level: 3,
      name: "Administrator",
      check: (message) => {
        try {
          const adminRole = message.guild.roles.cache.find(
            (r) =>
              r.name.toLowerCase() === message.settings.adminRole.toLowerCase()
          );
          return adminRole && message.member.roles.cache.has(adminRole.id);
        } catch (e) {
          return false;
        }
      },
    },

    {
      level: 4,
      name: "Server Owner",
      check: (message) => {
        const serverOwner = message.author ?? message.user;
        return message.guild?.ownerId === serverOwner.id;
      },
    },

    {
      level: 8,
      name: "Bot Support",
      check: (message) => {
        const botSupport = message.author ?? message.user;
        return config.support.includes(botSupport.id);
      },
    },

    {
      level: 9,
      name: "Bot Admin",
      check: (message) => {
        const botAdmin = message.author ?? message.user;
        return config.admins.includes(botAdmin.id);
      },
    },

    {
      level: 10,
      name: "Bot Owner",
      check: (message) => {
        const owner = message.author ?? message.user;
        return owner.id === process.env.OWNER;
      },
    },
  ],
};

module.exports = config;
