import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: true, // Enable debug mode to see errors in console
    trustHost: true, // Trust the host header
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: '/login',
        error: '/auth/error', // Custom error page
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Persist the OAuth access_token and user info to the token
            if (account) {
                token.accessToken = account.access_token
            }
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            // Send properties to the client
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
})
