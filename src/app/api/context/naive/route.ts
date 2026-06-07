import { getNaiveContext } from "@/lib/companyBrain/naiveRetriever";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    query: string;
    task?: string;
    topK?: number;
  };
  const result = await getNaiveContext({
    query: body.query,
    task: body.task,
    topK: body.topK,
  });
  return Response.json(result);
}
