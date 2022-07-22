import prism from "prism-media";

import { Client } from "discord.js";

import { EndBehaviorType, getVoiceConnection, entersState, VoiceConnectionStatus, VoiceConnectionDisconnectReason } from "@discordjs/voice";

import { createVoiceMessage } from "./voiceMessage/createVoiceMessage";

//------------------------------------------------------------//

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

//------------------------------------------------------------//

const activeGuildVoiceListeners = new Set<string>();

//------------------------------------------------------------//

export function addSpeechEvent(
  client: Client,
) {
  client.on<"voiceStateUpdate">("voiceStateUpdate", async (_old, newVoiceState) => {
    if (!newVoiceState.channel) return;

    const connection = getVoiceConnection(newVoiceState.channel.guild.id);
    if (!connection) return;

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.trace(error);

      return;
    }

    const isGuildVoiceListenerActive = activeGuildVoiceListeners.has(connection.joinConfig.guildId);
    if (isGuildVoiceListenerActive) return;
    activeGuildVoiceListeners.add(connection.joinConfig.guildId);

    connection.on<"stateChange">("stateChange", async (oldState, newState) => {
      switch (newState.status) {
        case VoiceConnectionStatus.Disconnected: {
          const disconnectedByWebsocket = newState.reason === VoiceConnectionDisconnectReason.WebSocketClose;
          if (disconnectedByWebsocket && newState.closeCode === 4014) {
            try {
                await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
            } catch {
                connection.destroy();
            }
          }

          /**
           * Attempt to manually rejoin the voice connection.
           * Wait 5 seconds before attempting each reconnect.
           */
          if (connection.rejoinAttempts < 5) {
            await delay((connection.rejoinAttempts + 1) * 5_000);

            connection.rejoin();

            break;
          }

          break;
        }

        case VoiceConnectionStatus.Destroyed: {
          activeGuildVoiceListeners.delete(connection.joinConfig.guildId);

          break;
        }

        case VoiceConnectionStatus.Connecting:
        case VoiceConnectionStatus.Signalling: {
          try {
            /**
             * Wait 20 seconds for the connection to become ready before destroying the voice connection.
             * This prevents the voice connection from permanently existing in one of these states.
             */
            await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
          } catch {
            connection.destroy();

            break;
          }

          break;
        }

        default: {
          break;
        }
      }
    });

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
