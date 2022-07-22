import prism from "prism-media";

import { Client } from "discord.js";

import { EndBehaviorType, getVoiceConnection, entersState, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";

import { createVoiceMessage } from "./voiceMessage/createVoiceMessage";

//------------------------------------------------------------//

function onSpeakingStartSpeechRecognition(client: Client, connection: VoiceConnection, userId: string) {
  const user = client.users.cache.get(userId);
  if (!user) return;
  if (user.bot) return;
  if (user.system) return;

  const opusStream = connection.receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 100,
    },
  });

  const bufferData: Uint8Array[] = [];
  opusStream.pipe(
    new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 })
  ).on("data", (data: Uint8Array) => {
    bufferData.push(data);
  });

  opusStream.on("end", async () => {
    const voiceMessage = await createVoiceMessage({
      client,
      bufferData,
      user,
      connection,
    });

    if (!voiceMessage) return;

    client.emit("speech", voiceMessage);
  });
}

//------------------------------------------------------------//

export function addSpeechEvent(
  client: Client<true>,
) {
  client.on<"voiceStateUpdate">("voiceStateUpdate", async (_old, newVoiceState) => {
    if (newVoiceState.id !== client.user.id) return;
    if (!newVoiceState.channel) return;

    // we can now assume that this voice state is for the bot

    const connection = getVoiceConnection(newVoiceState.channel.guild.id);
    if (!connection) return;

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.trace(error);

      return;
    }

    const isGuildVoiceListenerActive = Boolean(
      connection.receiver.speaking.listeners("start").find(
        (func) => func.name === "onSpeakingStartSpeechRecognition"
      )
    );
    if (isGuildVoiceListenerActive) return;

    connection.receiver.speaking.on("start", (userId) => onSpeakingStartSpeechRecognition(client, connection, userId));
  });
};
