import { handlers } from "@/auth";

// Force Node.js runtime so the database connection works on Vercel
export const runtime = "nodejs";

export const { GET, POST } = handlers;
