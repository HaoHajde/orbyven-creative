import { POST as handoffPost } from "@/app/api/ai/decisions/handoff/route";
import { desktopOptionsResponse, withDesktopCors } from "@/lib/desktop-api-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return desktopOptionsResponse();
}

export async function POST(request: Request) {
  return withDesktopCors(await handoffPost(request));
}
