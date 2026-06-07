import type { Chunk } from "@/lib/types";
import { fakeEmbedding } from "@/lib/companyBrain/scoring";

async function embedWithOpenAI(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
        input: texts,
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { data?: { embedding: number[] }[] };
    const embeddings = data.data?.map((item) => item.embedding);
    return embeddings?.length === texts.length ? embeddings : null;
  } catch {
    return null;
  }
}

export async function embedText(text: string) {
  const openAiEmbedding = await embedWithOpenAI([text]);
  return openAiEmbedding?.[0] ?? fakeEmbedding(text);
}

export async function embedChunks(chunks: Chunk[]) {
  const missing = chunks.filter((chunk) => !chunk.embedding);
  if (!missing.length) return chunks;

  const openAiEmbeddings = await embedWithOpenAI(missing.map((chunk) => chunk.text));
  let openAiIndex = 0;

  return chunks.map((chunk) => {
    if (chunk.embedding) return chunk;
    const embedding = openAiEmbeddings?.[openAiIndex] ?? fakeEmbedding(chunk.text);
    openAiIndex += 1;
    return { ...chunk, embedding };
  });
}
