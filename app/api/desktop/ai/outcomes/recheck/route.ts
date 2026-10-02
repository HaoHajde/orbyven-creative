import { POST as outcomePost } from "@/app/api/ai/outcomes/recheck/route";
import { desktopOptionsResponse, withDesktopCors } from "@/lib/desktop-api-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return desktopOptionsResponse();
}

export async function POST(request: Request) {
  return withDesktopCors(await outcomePost(request));
}
