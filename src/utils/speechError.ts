export enum SpeechErrorCode {
    NetworkRequest = 'NetworkRequest',
    NetworkResponse = 'NetworkResponse',
    ParseNetworkRequest = 'ParseNetworkRequest',
    CreateVoiceMessage = 'CreateVoiceMessage',
    Unknown = 'Unknown',
}

export class SpeechError {
    public readonly name = 'SpeechError';

    protected constructor(
        public readonly code: SpeechErrorCode,
        public readonly error: Error,
        public readonly details?: any,
    ) {}

    public static from(
        code: SpeechErrorCode,
        error: SpeechError | Error | string,
        details?: any,
    ): SpeechError {
        if (error instanceof SpeechError) return error;

        if (error instanceof Error) return new SpeechError(code, error);

        return new SpeechError(code, new Error(error), details);
    }
}
