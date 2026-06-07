import { transcribeAudio } from "@/lib/voice";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("audio");
    const mockText = formData.get("mockText");
    const result = await transcribeAudio({
      file: file instanceof File ? file : null,
      mockText: typeof mockText === "string" ? mockText : undefined,
    });
    return Response.json(result);
  }

  const body = (await request.json()) as { mockText?: string };
  const result = await transcribeAudio({ mockText: body.mockText });
  return Response.json(result);
}
