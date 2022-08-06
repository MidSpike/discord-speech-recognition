import axios from 'axios';
import { SpeechError, SpeechErrorCode } from '../utils/speechError';

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

    const response = await axios({
        method: 'post',
        url: `https://www.google.com/speech-api/v2/recognize?output=json&lang=${lang}&key=${key}&pFilter=${profanityFilter}`,
        headers: {
            'Content-Type': 'audio/l16; rate=48000;',
        },
        data: audioBuffer,
        validateStatus: () => true, // allow any status code to be returned without throwing an error
    });

    if (response.status !== 200) {
        throw SpeechError.from(SpeechErrorCode.NetworkRequest, 'resolveSpeechWithGoogleSpeechV2(): response.status !== 200', response);
    }

    /**
     * For some strange reason the google api returns invalid json with 2 objects in the response.
     * We have to account for this.
     * 
     * @example
     * The following is a sample response from the google api:
     * ```
     * {"result":[]}
     * {"result":[{"alternative":[{"transcript":"This is a test"}]}]}
     * ```
     */
    const response_data: string = response.data.replace('{\"result\":[]}', ''); // yes this is necessary

    const speechToText: string | undefined = JSON.parse(response_data).result?.at(0)?.alternative?.at(0)?.transcript;
    if (!speechToText) throw SpeechError.from(SpeechErrorCode.ParseNetworkRequest, 'resolveSpeechWithGoogleSpeechV2(): speechToText is undefined', response_data);

    return speechToText;
}
