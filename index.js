const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();

try {
  config = require('./config.json');
  var io = require('socket.io')(config.Port);
  bot.login(config.Token);
  var guildIDList = config.GuildID;
  var channelList = config.Channel;
} catch (e) {
  console.log("CONFIG FILE NOT FOUND");
}

var DiscordChannels = [];
var userCount = 0;

bot.on('ready', () => {
  
  console.log(`Logged in as ${bot.user.tag}!`);
  
  for (const guild of guildIDList) {
    g = bot.guilds.get(guild);
    for (const channel of channelList) {
      DiscordChannels.push(g.channels.find('name', channel));
    }
  }

  io.on('connection', (socket) => {
    
    userCount++;
    
    console.log("User count : " + userCount);
    
    socket.on('message', (msg) => {
      sendToGame(msg,socket);
      sendToDiscord(msg);
    });

    socket.on('disconnect', () => { 
      userCount--;
      console.log("User count : " + userCount);
    });

    socket.on('c', (name) => {
      console.log(name + " connected.")
    });
    socket.on('dc', (name) => {
      console.log(name + " disconnected.")
    });

    bot.on('message', message => {
      if (!message.author.bot && channelList.includes(message.channel.name)) {
        sendToGame({author : message.author.username, message : message.cleanContent.replace('<','&lt;')},socket);
      }
    }); 
  });
});

function sendToDiscord(o) {
  for (const channel of DiscordChannels) {
    try {
      channel.send(o.author + ': ' + unHtml(o.message));
    }
    catch (e) {}
    }
};

function sendToGame(o, s) {
try
{
s.emit('serverSent', o);
}
catch (e)
{
  console.log(e);
};
};

const unHtml = (() => {
  const replacements = {
    'quot': '"',
    'amp': '&',
    'lt': '<',
    'gt': '>',
    };
  return function unHtml(s) {
    return (s
      .replace(/<.*?>/g, '')
      .replace(/&(quot|amp|lt|gt);/g, (_, $1) => replacements[$1])
    );
  };
})();


