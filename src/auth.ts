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
                    scope: "openid email profile https://www.googleapis.com/auth/calendar.events.readonly",
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

                // Hardcoded Mock Accounts for Testing
                if (credentials.email === 'admin@holysheet.com' && credentials.password === 'password123') {
                    return {
                        id: 'mock-admin-id',
                        email: 'admin@holysheet.com',
                        name: 'Admin User',
                        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                        role: 'admin',
                        supabaseAccessToken: 'mock-admin-token'
                    };
                }

                if (credentials.email === 'user@holysheet.com' && credentials.password === 'password123') {
                    return {
                        id: 'mock-user-id',
                        email: 'user@holysheet.com',
                        name: 'John Doe',
                        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
                        role: 'user',
                        supabaseAccessToken: 'mock-user-token'
                    };
                }

                // JomCare Demo Accounts
                if (credentials.email === 'participant@jomcare.com' && credentials.password === 'password123') {
                    return {
                        id: 'mock-participant-id',
                        email: 'participant@jomcare.com',
                        name: 'Sarah Tan',
                        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                        role: 'participant',
                        supabaseAccessToken: 'mock-participant-token'
                    };
                }

                if (credentials.email === 'caregiver@jomcare.com' && credentials.password === 'password123') {
                    return {
                        id: 'mock-caregiver-id',
                        email: 'caregiver@jomcare.com',
                        name: 'Mary Lim',
                        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mary',
                        role: 'caregiver',
                        supabaseAccessToken: 'mock-caregiver-token'
                    };
                }

                if (credentials.email === 'admin@jomcare.com' && credentials.password === 'password123') {
                    return {
                        id: 'mock-jomcare-admin-id',
                        email: 'admin@jomcare.com',
                        name: 'JomCare Admin',
                        image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JomCareAdmin',
                        role: 'admin',
                        supabaseAccessToken: 'mock-jomcare-admin-token'
                    };
                }

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
        async signIn({ user, account, profile }) {
            if (account?.provider === "google" && user.email) {
                // Determine name and image from various possible sources in the callback objects
                const name = user.name || (profile as any)?.name || user.email.split('@')[0];
                const image = user.image || (profile as any)?.picture;

                const { error } = await supabase
                    .from('users')
                    .upsert({
                        email: user.email,
                        name: name,
                        image: image,
                    }, { onConflict: 'email' });

                if (error) {
                    console.error("Error upserting user from Google sign-in:", error.message);
                }
            }
            return true;
        },
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

            // Capture Google Access Token if signing in with Google
            if (account && account.provider === "google") {
                token.googleAccessToken = account.access_token;
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

            // Expose the Google Access Token to the client
            session.googleAccessToken = token.googleAccessToken;

            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
})
