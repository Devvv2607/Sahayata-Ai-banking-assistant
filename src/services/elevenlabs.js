export const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "";

export const VOICES = {
    STAFF: "JBFqnCBsd6RMkjVDRZzb", // George
    CUSTOMER: "EXAVITQu4vr4xnSDxMaL" // Sarah
};

export async function synthesizeText(text, voiceId = VOICES.STAFF) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    });

    if (!response.ok) {
        throw new Error(`ElevenLabs API failed with status ${response.status}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
}

export async function translateTextToRegional(text, targetLang) {
    const langCode = targetLang === "Marathi" ? "mr" : targetLang === "Gujarati" ? "gu" : "hi";
    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`);
        const data = await res.json();
        if (data?.responseData?.translatedText) return data.responseData.translatedText;
    } catch (e) {
        console.error("Translation error:", e);
    }
    return text;
}
