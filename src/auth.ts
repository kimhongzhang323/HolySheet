import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';
import { authConfig } from './auth.config';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                await dbConnect();

                // Explicitly find user with password field selected
                const user = await User.findOne({ email: credentials.email }).select('+password');

                if (!user || !user.password) return null;

                // Check verification status
                if (!user.isVerified) {
                    throw new Error("Account not verified. Please verify your email.");
                }

                const isValid = await bcrypt.compare(credentials.password as string, user.password);

                if (!isValid) return null;

                return { id: user._id.toString(), name: user.name, email: user.email, role: user.role, image: user.image };
            }
        }),
    ],
    // DB Session Strategy (Default with Adapter) - Removed 'session: { strategy: "jwt" }'
    callbacks: {
        async signIn({ user, account, profile }) {
            // For Credentials, this might run before session creation
            // For OAuth, this runs before user creation/update in the adapter? 
            // verifying access.
            await dbConnect();

            if (user && user.email) {
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    const isProfileIncomplete = !dbUser.phoneNumber || !dbUser.address || !dbUser.address.city;

                    // If incomplete and no deadline set, set 3 day deadline
                    if (isProfileIncomplete && !dbUser.profileDeadline) {
                        const deadline = new Date();
                        deadline.setDate(deadline.getDate() + 3);
                        dbUser.profileDeadline = deadline;
                        await dbUser.save();
                    }
                }
            }
            return true;
        },
        session({ session, user }) {
            // In database strategy, 'user' is the user object from DB
            if (session.user && user) {
                session.user.id = user.id;
                session.user.role = user.role;
                session.user.profileDeadline = (user as any).profileDeadline;
            }
            return session;
        }
    },
});
