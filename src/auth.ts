import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabaseClient"

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: true,
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "openid email profile",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const { data, error } = await supabase.auth.signInWithPassword({
                    email: credentials.email as string,
                    password: credentials.password as string
                });

                if (error || !data.user || !data.session) {
                    console.error("Supabase Auth Error:", error?.message);
                    return null;
                }

                return {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
                    image: data.user.user_metadata?.avatar_url,
                    role: data.user.email === 'admin@holysheet.com' ? "admin" : (data.user.user_metadata?.role || "user"),
                    supabaseAccessToken: data.session.access_token // Pass this to JWT callback
                };
            }
        }),
    ],
    // session: { strategy: "jwt" }, // Default
    callbacks: {
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;

                // Backup check for admin email if role is missing (e.g. initial Google login)
                if (!token.role && user.email === 'admin@holysheet.com') {
                    token.role = 'admin';
                }

                token.role = token.role || "user";

                // Capture Supabase Access Token from 'authorize' return or Google account
                token.supabaseAccessToken = (user as any).supabaseAccessToken || account?.access_token;
            }
            // Note: For Google, 'account.access_token' is Google's token, NOT Supabase's.
            // But Supabase client-side can handle Google Auth via 'signInWithOAuth'.
            // For now, focusing on Credentials flow which returns a real Supabase JWT.

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            // Expose the Supabase access token to the client so calls can be made
            (session as any).accessToken = token.supabaseAccessToken;

            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
})
