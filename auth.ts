import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Login failed: Missing email or password");
            return null;
          }

          const emailToFind = (credentials.email as string).toLowerCase();
          console.log("🔍 Attempting login for:", emailToFind);

          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, emailToFind))
            .limit(1);

          if (user.length === 0) {
            console.log("❌ Login failed: User not found in database");
            return null;
          }

          if (!user[0].passwordHash) {
            console.log("❌ Login failed: User has no password (maybe signed up with Google?)");
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user[0].passwordHash
          );

          if (!isValid) {
            console.log("❌ Login failed: Incorrect password");
            return null;
          }

          console.log("✅ Login successful for:", emailToFind);
          return { id: user[0].id, email: user[0].email, name: user[0].name };
        } catch (error) {
          console.error("❌ Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "wisher";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
