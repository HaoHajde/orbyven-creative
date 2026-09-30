import { POST as intelligencePost } from "@/app/api/ai/intelligence/route";
import { desktopOptionsResponse, withDesktopCors } from "@/lib/desktop-api-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return desktopOptionsResponse();
}

export async function POST(request: Request) {
  return withDesktopCors(await intelligencePost(request));
}
