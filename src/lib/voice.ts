export async function transcribeAudio(input: { mockText?: string; file?: File | null }) {
  if (!process.env.OPENAI_API_KEY || !input.file) {
    return {
      transcript:
        input.mockText || "Hi, checkout is failing for our EU users. Can you help?",
      mocked: true,
    };
  }

  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("model", "gpt-4o-mini-transcribe");

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error("Transcription failed");
    const data = (await response.json()) as { text?: string };
    return { transcript: data.text || "", mocked: false };
  } catch {
    return {
      transcript:
        input.mockText || "Hi, checkout is failing for our EU users. Can you help?",
      mocked: true,
    };
  }
}

export async function synthesizeVoice(input: { text: string; voice?: string }) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      mocked: true,
      audioUrl: "mock-audio://support-response",
      text: input.text,
    };
  }

  try {
    const voice = input.voice?.startsWith("voice_")
      ? { id: input.voice }
      : input.voice || "alloy";
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: input.text,
      }),
    });
    if (!response.ok) throw new Error("Speech synthesis failed");
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      mocked: false,
      audioUrl: `data:audio/mpeg;base64,${buffer.toString("base64")}`,
      text: input.text,
    };
  } catch {
    return {
      mocked: true,
      audioUrl: "mock-audio://support-response",
      text: input.text,
    };
  }
}
