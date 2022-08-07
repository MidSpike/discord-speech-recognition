//------------------------------------------------------------//
//        Copyright (c) MidSpike, All rights reserved.        //
//------------------------------------------------------------//

import prism from 'prism-media';

import { Client } from 'discord.js';

import { EndBehaviorType, getVoiceConnection, entersState, VoiceConnectionStatus } from '@discordjs/voice';

import { VoiceMessage } from './voice_message';

import { SpeechErrorCode, SpeechError } from './speech_error';

//------------------------------------------------------------//

export enum Events {
    Error = 'discordSpeechRecognition:error',
    VoiceMessage = 'discordSpeechRecognition:voiceMessage',
}

//------------------------------------------------------------//

export type AttachSpeechEventOptions = {
    client: Client<true>;
    shouldProcessUserId?: (userId: string) => Promise<boolean>;
}

//------------------------------------------------------------//

export function attachSpeechEvent({
    client,
    shouldProcessUserId,
}: AttachSpeechEventOptions) {
    client.on('voiceStateUpdate', async (_old, newVoiceState) => {
        if (newVoiceState.id !== client.user.id) return;

        const connection = getVoiceConnection(newVoiceState.guild.id);
        if (!connection) return;

        try {
            await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
        } catch (error) {
            console.trace(error);

            return;
        }

        /** @todo find a less hacky way to determine if the listener is active */
        const isGuildVoiceListenerActive = Boolean(
            connection.receiver.speaking.listeners('start').find(
                (func) => func.name === 'onDiscordSpeechRecognitionReceiverStart'
            )
        );
        if (isGuildVoiceListenerActive) return;

        connection.receiver.speaking.on('start', async function onDiscordSpeechRecognitionReceiverStart(userId) {
            if (
                typeof shouldProcessUserId === 'function' &&
                !(await shouldProcessUserId(userId))
            ) return;

            const opusStream = connection.receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.AfterSilence,
                    duration: 100, // unknown reason for this value, but it works for now
                },
            });

            const bufferData: Uint8Array[] = [];
            opusStream.pipe(
                new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 })
            ).on('data', (data: Uint8Array) => {
                bufferData.push(data);
            });

            opusStream.on('error', (error) => {
                client.emit(Events.Error, SpeechError.from(SpeechErrorCode.Unknown, error, 'Opus Stream Error'));
            });

            opusStream.on('end', async () => {
                let voiceMessage;
                try {
                    voiceMessage = await VoiceMessage.from({
                        connection: connection,
                        bufferData: bufferData,
                        client: client,
                        userId: userId,
                    });
                } catch (error) {
                    client.emit(Events.Error, SpeechError.from(SpeechErrorCode.CreateVoiceMessage, error as Error | string, 'Failed to create VoiceMessage'));

                    return;
                }
                if (!voiceMessage) return;

                client.emit(Events.VoiceMessage, voiceMessage);
            });
        });
    });
}
