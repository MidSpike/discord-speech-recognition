# Discord Speech Recognition

This is an extension for discord.js that allows for easy access to speech-to-text processing.

## Installation

```
npm i @midspike/discord-speech-recognition
```

## Example (discord.js v14)

```javascript
const Discord = require("discord.js");

const { attachSpeechEvent, SpeechErrorCode } = require("discord-speech-recognition");

//------------------------------------------------------------//

const client = new Discord.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
  ],
});

attachSpeechEvent({
  client: client,
  shouldProcessUserId: (userId) => {
    // Assuming that the bot is currently in a voice channel with a user,
    // every time that a user in the voice channel starts speaking,
    // this function will be called to check if the user's voice should be processed

    // You should ignore bots, system accounts, and people who do not want to be processed.

    // Due to laws such as GDPR, it is highly recommended to
    // have users opt-in to your bot's speech recognition.

    // return true to process the user's voice.
    // return false to not process the user's voice.
  }
});

//------------------------------------------------------------//

client.on('speechError', (speechError) => {
  // It is highly recommended to filter out errors that you don't care about.
  // Use `speechError.code` and the enum `SpeechErrorCode` to filter.

  console.trace(speechError);
});

client.on('speech', (voiceMessage) => {
  console.log(voiceMessage); // voiceMessage is an instance of a VoiceMessage
});

//------------------------------------------------------------//

client.login('YOUR_TOKEN_GOES_HERE');
```
