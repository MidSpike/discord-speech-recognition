# Discord Speech Recognition

This is an extension for discord.js that allows for easy access to speech-to-text processing.

## Installation

```
npm i @midspike/discord-speech-recognition
```

## Example (discord.js v14)

```typescript
import * as Discord from 'discord.js';

import * as DiscordSpeechRecognition from '@midspike/discord-speech-recognition';

//------------------------------------------------------------//

const discord_client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildVoiceStates,
  ],
});

// Attaches custom event listeners to the client.
// This should be done before the client is ready.
DiscordSpeechRecognition.attachSpeechEvent({
  client: discord_client as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  shouldProcessUserId: (userId) => {
    // Assuming that the bot is currently in a voice channel with a user,
    // every time that a user in the voice channel starts speaking,
    // this function will be called to check if the user's voice should be processed

    // You should ignore bots, system accounts, and people who do not want to be processed.

    // Due to laws such as GDPR, it is highly recommended to
    // have users opt-in to your bot's speech recognition.

    // return true to process the user's voice.
    // return false to not process the user's voice.

    return true; // process all users
  },
});

//------------------------------------------------------------//

client.on(DiscordSpeechRecognition.Events.Error, (speechError: DiscordSpeechRecognition.SpeechError) => {
  // It is highly recommended to filter out errors that you don't care about.
  // Use `speechError.code` and the enum `SpeechErrorCode` to filter.

  console.trace(speechError);
});

client.on(DiscordSpeechRecognition.Events.VoiceMessage, (voiceMessage: DiscordSpeechRecognition.VoiceMessage) => {
  // This event is fired every time a user finishes speaking.
  // The `voiceMessage` parameter contains the user's voice data.

  console.log(voiceMessage);
});

client.on(Discord.Events.ClientReady, () => {
  // have the bot join a voice channel
});

//------------------------------------------------------------//

// Pro-tip: you should store your bot's token in an .env file, or
// through an environment variable, instead of hard-coding it here.
client.login('YOUR_TOKEN_GOES_HERE');
```
