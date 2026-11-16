import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const cookieStore = await cookies();
  cookieStore.set("dev_user_id", userId, { path: "/" });

  return NextResponse.redirect(new URL("/", req.url));
}
