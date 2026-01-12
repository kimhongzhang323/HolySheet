import NextAuth, { DefaultSession } from "next-auth"
import { AdapterUser } from "next-auth/adapters"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role?: 'user' | 'volunteer' | 'staff' | 'admin';
            /** The user's usage tier. */
            tier?: 'ad-hoc' | 'weekly';
            id: string;
        } & DefaultSession["user"]
    }

    interface User {
        role?: 'user' | 'volunteer' | 'staff' | 'admin';
        tier?: 'ad-hoc' | 'weekly';
        skills?: string[];
    }
}

declare module "next-auth/adapters" {
    interface AdapterUser {
        role?: 'user' | 'volunteer' | 'staff' | 'admin';
        tier?: 'ad-hoc' | 'weekly';
        skills?: string[];
    }
}
