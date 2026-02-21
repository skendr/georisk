import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userActions } from "@/db/schema";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { actionType, actionData, pagePath } = await request.json();

  if (!actionType) {
    return NextResponse.json({ error: "actionType is required" }, { status: 400 });
  }

  await db.insert(userActions).values({
    userId: session.user.id,
    actionType,
    actionData: actionData ?? null,
    pagePath: pagePath ?? null,
  });

  return NextResponse.json({ ok: true });
}
