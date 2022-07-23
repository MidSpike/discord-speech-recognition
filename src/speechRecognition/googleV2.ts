import axios from 'axios';

//------------------------------------------------------------//

/**
 * Performs speech recognition using the Google Speech Recognition API V2
 * @param audioBuffer PCM mono audio with 48kHz sample rate
 * @returns Recognized text from speech
 */
export async function resolveSpeechWithGoogleSpeechV2(
    audioBuffer: Buffer,
): Promise<string> {
    const key = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw';
    const lang = 'en-US';
    const profanityFilter = '1';

    let response;
    try {
        response = await axios({
            method: 'post',
            url: `https://www.google.com/speech-api/v2/recognize?output=json&lang=${lang}&key=${key}&pFilter=${profanityFilter}`,
            headers: {
                'Content-Type': 'audio/l16; rate=48000;',
            },
            data: audioBuffer,
        });
    } catch (error) {
        console.trace('resolveSpeechWithGoogleSpeechV2(): failed to send request to Google;', { error });

        throw error; // rethrow error after logging it
    }

    const speechToText = response.data.result?.at(0)?.alternative?.at(0)?.transcript;
    if (!speechToText) throw new Error('resolveSpeechWithGoogleSpeechV2(): failed to receive speech from Google;');

    return speechToText;
}
