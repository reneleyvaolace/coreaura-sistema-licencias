// lib/auth/nextAuth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { firebaseApp } from "@/lib/firebase/config"; // Ajusta la ruta si es necesario

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "",
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER || "",
          pass: process.env.EMAIL_SERVER_PASS || "",
        },
      },
      from: process.env.EMAIL_FROM || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "email@dominio.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const auth = getAuth(firebaseApp);
        try {
          const userCred = await signInWithEmailAndPassword(
            auth,
            credentials!.email,
            credentials!.password
          );
          if (userCred.user) {
            // Devuelve datos mínimos requeridos por NextAuth
            return {
              id: userCred.user.uid,
              email: userCred.user.email,
              name: userCred.user.displayName || "",
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  adapter: FirestoreAdapter({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  }),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      session.user.role = token.role || "customer";
      session.user.id = token.sub;
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role || "customer";
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
