import { synthesizeVoice } from "@/lib/voice";

export async function POST(request: Request) {
  const body = (await request.json()) as { text: string; voice?: string };
  const result = await synthesizeVoice(body);
  return Response.json(result);
}
