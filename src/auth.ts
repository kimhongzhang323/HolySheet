import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabaseClient"
import bcrypt from "bcryptjs"

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

                // Query the 'users' table directly
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', credentials.email)
                    .single();

                if (error || !user) {
                    console.error("Auth Error (Custom Table):", error?.message);
                    return null;
                }

                // Password Verification
                let isValid = false;
                if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                    // It's a bcrypt hash
                    isValid = await bcrypt.compare(credentials.password as string, user.password);
                } else {
                    // Plain text comparison (for mock data like 'hashed_password123')
                    isValid = (credentials.password === user.password);
                }

                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || user.email.split('@')[0],
                    image: user.image,
                    role: user.role || "user",
                    supabaseAccessToken: "custom-table-token" // Placeholder as we aren't using Supabase Auth sessions
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
                // For Google, we use the email as a fallback token for the backend's "Local DB Auth" check
                token.supabaseAccessToken = (user as any).supabaseAccessToken || user.email;
            }

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
