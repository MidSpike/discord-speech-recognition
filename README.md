# Discord Speech Recognition Extension

This is an extension for [discord.js](https://discord.js.org) library that makes creating discord speech recognition bots as easy as common text bots.

## Installation

`npm i discord-speech-recognition`

You need also dependency for voice, recommended:  
`npm i @discordjs/opus`  
You can read more here: <https://discordjs.guide/voice/#installing-dependencies>

## Docs

<https://discordsr.netlify.app/>

## Example usage

```javascript
const { Client, Message } = require("discord.js");
const { addSpeechEvent } = require("discord-speech-recognition");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
});
addSpeechEvent(client);

client.on("messageCreate", (msg) => {
  const voiceChannel = msg.member?.voice.channel;
  if (voiceChannel) {
    joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });
  }
});

client.on("speech", (msg) => {
  msg.author.send(msg.content);
});

client.login("token");
```