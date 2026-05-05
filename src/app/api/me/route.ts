import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "@/lib/api-auth";

export async function GET(req: Request) {
  const user = await getUserFromAuthHeader(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
