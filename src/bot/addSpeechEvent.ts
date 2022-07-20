import prism from "prism-media";

import { Client } from "discord.js";

import { EndBehaviorType, getVoiceConnection, entersState, VoiceConnectionStatus } from "@discordjs/voice";

import { createVoiceMessage } from "./voiceMessage/createVoiceMessage";

//------------------------------------------------------------//

const activeGuildVoiceListeners = new Set<string>();

//------------------------------------------------------------//

export function addSpeechEvent(
  client: Client,
) {
  client.on("voiceStateUpdate", async (_old, newVoiceState) => {
    if (!newVoiceState.channel) return;

    const connection = getVoiceConnection(newVoiceState.channel.guild.id);
    if (!connection) return;

    const isGuildVoiceListenerActive = activeGuildVoiceListeners.has(connection.joinConfig.guildId);
    if (isGuildVoiceListenerActive) return;
    activeGuildVoiceListeners.add(connection.joinConfig.guildId);

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.trace(error);

      return;
    }

    connection.receiver.speaking.on("start", (userId) => {
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
    });
  });
};
