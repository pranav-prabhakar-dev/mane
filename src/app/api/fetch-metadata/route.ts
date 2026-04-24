import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchProductMetadata } from "@/lib/metadata";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const data = await fetchProductMetadata(url);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Couldn't read that page — you can enter details manually.",
      },
      { status: 200 }, // Soft-fail: client uses manual fallback
    );
  }
}
