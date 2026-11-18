import { NextRequest, NextResponse } from "next/server";
import { Bucket } from "@upstash/blob";

const bucket = Bucket.fromEnv();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const uniqueName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;

    const blob = await bucket.put(uniqueName, file, {
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
