import { POST as recoverPost } from "@/app/api/ai/plans/recover/route";
import { desktopOptionsResponse, withDesktopCors } from "@/lib/desktop-api-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return desktopOptionsResponse();
}

export async function POST(request: Request) {
  return withDesktopCors(await recoverPost(request));
}
