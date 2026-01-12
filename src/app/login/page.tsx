'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');

    const handleSuccess = async (credentialResponse: any) => {
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || 'Login failed');
            }

            const data = await res.json();

            // Store token
            localStorage.setItem('token', data.access_token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Redirect to home or dashboard
            router.push('/');

        } catch (err: any) {
            console.error('Login Error:', err);
            setError(err.message);
        }
    };

    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sign in to HolySheet</h2>
                        <p className="mt-2 text-sm text-gray-600">Access your activity hub</p>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center py-4">
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => setError('Google Login Failed')}
                            useOneTap
                        />
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}
