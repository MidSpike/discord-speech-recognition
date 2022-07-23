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
            transformResponse: [
                (data) => {
                    const fixedData = data.replace('{\"result\":[]}', '');
                    try {
                        return JSON.parse(fixedData);
                    } catch (error) {
                        console.trace(error);

                        return {
                            error: error,
                        };
                    }
                },
            ],
        });
    } catch (error) {
        console.trace(error);

        throw error; // rethrow error after logging it
    }

    if (response.data.error) throw new Error(`Google speech api error: ${response.data}`);

    return response.data.result[0].alternative[0].transcript;
}
