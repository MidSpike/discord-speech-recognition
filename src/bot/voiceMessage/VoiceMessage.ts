import { Client, VoiceBasedChannel } from 'discord.js';

import { VoiceConnection } from '@discordjs/voice';

import { convertStereoToMono, getDurationFromMonoBuffer } from '../../utils/audio';

import { resolveSpeechWithGoogleSpeechV2 } from '../../speechRecognition/googleV2';

//------------------------------------------------------------//

type VoiceMessageConstructorOptions = {
    /** The discord client responsible for recording the voice message */
    client: Client<true>;
    /** The voice channel the message originated from */
    channel: VoiceBasedChannel;
    /** The voice connection used */
    connection: VoiceConnection;
    /** PCM mono 48k audio data */
    audioBuffer: Buffer;
    /** The user id that this voice message belongs to */
    userId: string;
    /** The contents of the speech-to-text from the voice message */
    content: string | undefined;
    /** The duration in seconds */
    duration: number;
}

export class VoiceMessage {
    public client;
    public channel;
    public connection;
    public audioBuffer;
    public userId;
    public content;
    public duration;

    private constructor({
        client,
        channel,
        connection,
        userId,
        content,
        duration,
        audioBuffer,
    }: VoiceMessageConstructorOptions) {
        this.client = client;
        this.channel = channel;
        this.content = content;
        this.userId = userId;
        this.audioBuffer = audioBuffer;
        this.connection = connection;
        this.duration = duration;
    }

    static async from({
        client,
        connection,
        bufferData,
        userId,
    }: {
        client: Client<true>;
        connection: VoiceConnection;
        bufferData: Uint8Array[];
        userId: string;
    }) {
        if (!connection.joinConfig.channelId) return undefined;

        const stereoBuffer = Buffer.concat(bufferData);
        const monoBuffer = convertStereoToMono(stereoBuffer);

        const duration = getDurationFromMonoBuffer(monoBuffer);
        if (duration < 1 || duration > 19) return undefined; // values are possibly hard-coded to prevent abuse

        const content = await resolveSpeechWithGoogleSpeechV2(monoBuffer);

        const channel = client.channels.cache.get(connection.joinConfig.channelId);
        if (!channel?.isVoiceBased()) return undefined;

        const voiceMessage = new VoiceMessage({
            client: client,
            channel: channel,
            userId: userId,
            duration: duration,
            audioBuffer: stereoBuffer,
            content: content,
            connection: connection,
        });

        return voiceMessage;
    }
}
