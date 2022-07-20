import { VoiceConnection } from "@discordjs/voice";

import { Client, User } from "discord.js";

import {
  convertStereoToMono,
  getDurationFromMonoBuffer,
} from "../../utils/audio";

import { VoiceMessage } from "./VoiceMessage";

import { resolveSpeechWithGoogleSpeechV2 } from "../../speechRecognition/googleV2";

//------------------------------------------------------------//

type CreateVoiceMessageOptions = {
  user: User;
  client: Client;
  connection: VoiceConnection;
  bufferData: Uint8Array[];
};

//------------------------------------------------------------//

export async function createVoiceMessage({
  user,
  client,
  connection,
  bufferData,
}: CreateVoiceMessageOptions): Promise<VoiceMessage | undefined> {
  if (!connection.joinConfig.channelId) return undefined;

  const stereoBuffer = Buffer.concat(bufferData);
  const monoBuffer = convertStereoToMono(stereoBuffer);

  const duration = getDurationFromMonoBuffer(monoBuffer);
  if (duration < 1 || duration > 19) return undefined;

  let content: string | undefined;
  let error: Error | undefined;
  try {
    content = await resolveSpeechWithGoogleSpeechV2(monoBuffer);
  } catch (e) {
    error = e as Error;
  }

  const channel = client.channels.cache.get(connection.joinConfig.channelId);
  if (!channel?.isVoiceBased()) return undefined;

  const voiceMessage = new VoiceMessage({
    client,
    data: {
      author: user,
      duration,
      audioBuffer: stereoBuffer,
      content,
      error,
      connection,
    },
    channel,
  });

  return voiceMessage;
};
