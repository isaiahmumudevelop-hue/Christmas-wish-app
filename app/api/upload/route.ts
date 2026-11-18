import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize the S3 Client for Upstash Blob
const S3 = new S3Client({
  region: "auto",
  // Upstash Blob is S3-compatible, so we use their endpoint
  endpoint: "https://blob.upstash.io",
  credentials: {
    accessKeyId: "upstash",
    // Your secret access key is your Upstash Bucket Token
    secretAccessKey: process.env.UPSTASH_BLOB_TOKEN!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;

    // Upload to Upstash Blob
    await S3.send(
      new PutObjectCommand({
        Bucket: process.env.UPSTASH_BLOB_BUCKET, // e.g., "christmas-wish-uploads"
        Key: uniqueName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Return the public URL
    // Upstash provides a CDN URL for public files
    const publicUrl = `${process.env.UPSTASH_BLOB_URL}/${uniqueName}`;
    return NextResponse.json({ url: publicUrl });
    
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
