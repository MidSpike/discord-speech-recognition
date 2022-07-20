import { VoiceMessage } from "./bot/voiceMessage/VoiceMessage";

//------------------------------------------------------------//

/**
 * Emitted when someone ends talking in channel
 *
 * @param voiceMessage
 *
 * @example
 * ```javascript
 * client.on("speech", (msg) => {
 *   msg.author.send(msg.content);
 * });
 * ```
 *
 * @event
 */
export declare function speech(voiceMessage: VoiceMessage): void;

/**
 * Emitted when error occurs during processing audio stream.
 * Usually when someone tries to talk using web version of discord.
 * See https://github.com/discordjs/opus/issues/49
 * @asMemberOf DiscordSR
 * @param error
 * @event
 */
export declare function audioStreamError(error: Error): void;
