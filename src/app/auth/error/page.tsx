'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const errorMessages: Record<string, string> = {
        Configuration: "There is a problem with the server configuration.",
        AccessDenied: "Access was denied. You may have cancelled the login.",
        Verification: "The verification token has expired or has already been used.",
        OAuthSignin: "Error in constructing an authorization URL.",
        OAuthCallback: "Error in handling the response from the OAuth provider.",
        OAuthCreateAccount: "Could not create OAuth provider user in the database.",
        EmailCreateAccount: "Could not create email provider user in the database.",
        Callback: "Error in the OAuth callback handler route.",
        OAuthAccountNotLinked: "Email on the account is already linked, but not with this OAuth account.",
        EmailSignin: "Check your email for the sign in link.",
        CredentialsSignin: "Sign in failed. Check the credentials you provided.",
        SessionRequired: "Please sign in to access this page.",
        Default: "An unknown error occurred.",
    };

    const errorMessage = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
                <p className="text-gray-600">{errorMessage}</p>
                {error && (
                    <p className="text-sm text-gray-400 bg-gray-100 p-2 rounded-lg font-mono">
                        Error code: {error}
                    </p>
                )}
                <Link
                    href="/login"
                    className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                    Try Again
                </Link>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ErrorContent />
        </Suspense>
    );
}
