import { GET as plansGet } from "@/app/api/ai/plans/route";
import { desktopOptionsResponse, withDesktopCors } from "@/lib/desktop-api-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return desktopOptionsResponse();
}

export async function GET(request: Request) {
  return withDesktopCors(await plansGet(request));
}
