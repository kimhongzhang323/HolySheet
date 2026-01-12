import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        // signIn: '/login', // Commented out to use default page for testing
    },
    providers: [
        // Added later in auth.ts to avoid edge incompatibility with some adapters/providers if needed.
        // However, Google provider is generally fine. Keeping structure clean.
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isAdmin = auth?.user?.role === 'staff' || auth?.user?.role === 'admin';
            const isOnAdminPanel = nextUrl.pathname.startsWith('/admin');

            if (isOnAdminPanel) {
                if (isLoggedIn && isAdmin) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
        session({ session, user, token }) {
            // When using database strategy (Adapter), the 'user' object is passed.
            // When using jwt, 'token' is passed.
            // We will augment the session with user details.
            if (session.user) {
                // @ts-ignore
                session.user.id = user?.id || token?.sub;
                // @ts-ignore
                session.user.role = user?.role || token?.role;
            }
            return session;
        }
    },
} satisfies NextAuthConfig;
