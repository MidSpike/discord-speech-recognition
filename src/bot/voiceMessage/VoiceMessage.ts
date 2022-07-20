import { Client, User, VoiceBasedChannel } from "discord.js";

import { VoiceConnection } from "@discordjs/voice";

//------------------------------------------------------------//

export interface VoiceMessageData {
  error?: Error;
  content?: string;
  author: User;
  connection: VoiceConnection;
  audioBuffer: Buffer;
  duration: number;
}

export class VoiceMessage {
  channel: VoiceBasedChannel;

  /**
   * Speech to text translation
   */
  content?: string;

  author: User;

  /**
   * Duration in seconds
   */
  duration: number;

  /**
   * PCM mono 48k audio data
   */
  audioBuffer: Buffer;

  client: Client;

  /**
   * If there was any error during handling speech event, this will be set
   */
  error?: Error;

  connection: VoiceConnection;

  /**
   * Voice message, it is emitted `speech` event
   * @private
   */
  constructor({
    client,
    data,
    channel,
  }: {
    client: Client;
    channel: VoiceBasedChannel;
    data: VoiceMessageData;
  }) {
    this.error = data?.error;
    this.content = data?.content;
    this.author = data.author;
    this.audioBuffer = data.audioBuffer;
    this.connection = data.connection;
    this.duration = data.duration;
    this.client = client;
    this.channel = channel;
  }
}
