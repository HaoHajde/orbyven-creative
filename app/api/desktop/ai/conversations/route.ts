import { GET as conversationsGet } from "@/app/api/ai/conversations/route";
import { desktopOptionsResponse, withDesktopCors } from "@/lib/desktop-api-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return desktopOptionsResponse();
}

export async function GET(request: Request) {
  return withDesktopCors(await conversationsGet(request));
}
