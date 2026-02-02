'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, User, Heart, HandHelping, ArrowLeft, Users, Shield } from 'lucide-react';

type UserType = 'participant' | 'caregiver' | 'admin' | null;

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

    // Redirect based on role if session exists
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const role = (session.user as any).role;
            if (role === 'admin' || role === 'staff') {
                router.push('/admin');
            } else if (role === 'caregiver') {
                router.push('/dashboard');
            } else {
                // Participant goes to calendar
                router.push('/calendar');
            }
        }
    }, [session, status, router]);

    // Handle Email/Password Login
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setIsLoading(false);
            }
            // Transition is handled by useEffect on session change
        } catch (err) {
            setError('An error occurred during sign in');
            setIsLoading(false);
        }
    };

    // Handle Google Login via NextAuth
    const handleGoogleLogin = () => {
        setIsLoading(true);
        // Pass the selected user type to the callback
        signIn('google', { callbackUrl: `/api/auth/callback/google?userType=${selectedUserType}` });
    };

    const getUserTypeConfig = (type: UserType) => {
        switch (type) {
            case 'participant':
                return {
                    icon: User,
                    title: 'Participant',
                    description: 'I want to join activities and events',
                    color: 'blue',
                    bgGradient: 'from-blue-500 to-blue-600',
                    lightBg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-700',
                    ring: 'ring-blue-500/20',
                    focusBorder: 'focus:border-blue-400'
                };
            case 'caregiver':
                return {
                    icon: Heart,
                    title: 'Caregiver',
                    description: 'I manage activities for someone I care for',
                    color: 'pink',
                    bgGradient: 'from-pink-500 to-pink-600',
                    lightBg: 'bg-pink-50',
                    border: 'border-pink-200',
                    text: 'text-pink-700',
                    ring: 'ring-pink-500/20',
                    focusBorder: 'focus:border-pink-400'
                };
            case 'admin':
                return {
                    icon: Shield,
                    title: 'Admin',
                    description: 'I manage and oversee the platform',
                    color: 'purple',
                    bgGradient: 'from-purple-500 to-purple-600',
                    lightBg: 'bg-purple-50',
                    border: 'border-purple-200',
                    text: 'text-purple-700',
                    ring: 'ring-purple-500/20',
                    focusBorder: 'focus:border-purple-400'
                };
            default:
                return null;
        }
    };

    const currentConfig = selectedUserType ? getUserTypeConfig(selectedUserType) : null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* User Type Selection */}
                {!selectedUserType ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50 p-8 space-y-6 animate-in fade-in duration-300">
                        {/* Header with Logo */}
                        <div className="text-center space-y-2">
                            <img src="/logo.png" alt="JomCare" className="w-16 h-16 mx-auto mb-2" />
                            <h1 className="text-2xl font-bold text-gray-900">Welcome to JomCare</h1>
                            <p className="text-sm text-gray-500">Choose how you'd like to sign in</p>
                        </div>

                        {/* User Type Options */}
                        <div className="space-y-3">
                            {/* Participant Option */}
                            <button
                                onClick={() => {
                                    setSelectedUserType('participant');
                                    setEmail('participant@jomcare.com');
                                    setPassword('password123');
                                }}
                                className="w-full p-4 bg-white border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 rounded-2xl transition-all duration-200 group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                        <User size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Participant</h3>
                                        <p className="text-sm text-gray-500">I want to join activities and events</p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-blue-400 group-hover:bg-blue-100 transition-all"></div>
                                </div>
                            </button>

                            {/* Caregiver Option */}
                            <button
                                onClick={() => {
                                    setSelectedUserType('caregiver');
                                    setEmail('caregiver@jomcare.com');
                                    setPassword('password123');
                                }}
                                className="w-full p-4 bg-white border-2 border-gray-100 hover:border-pink-300 hover:bg-pink-50/50 rounded-2xl transition-all duration-200 group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                                        <Heart size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 group-hover:text-pink-700 transition-colors">Caregiver</h3>
                                        <p className="text-sm text-gray-500">I manage activities for someone I care for</p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-pink-400 group-hover:bg-pink-100 transition-all"></div>
                                </div>
                            </button>

                            {/* Admin Option */}
                            <button
                                onClick={() => {
                                    setSelectedUserType('admin');
                                    setEmail('admin@jomcare.com');
                                    setPassword('password123');
                                }}
                                className="w-full p-4 bg-white border-2 border-gray-100 hover:border-purple-300 hover:bg-purple-50/50 rounded-2xl transition-all duration-200 group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                        <Shield size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 group-hover:text-purple-700 transition-colors">Admin</h3>
                                        <p className="text-sm text-gray-500">I manage and oversee the platform</p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-purple-400 group-hover:bg-purple-100 transition-all"></div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Login Card */
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/50 p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Back Button */}
                        <button
                            onClick={() => { setSelectedUserType(null); setError(''); }}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Change user type
                        </button>

                        {/* Header with Selected User Type */}
                        <div className="text-center space-y-2">
                            {currentConfig && (
                                <div className={`w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br ${currentConfig.bgGradient} flex items-center justify-center text-white shadow-lg`}>
                                    <currentConfig.icon size={32} />
                                </div>
                            )}
                            <h1 className="text-2xl font-bold text-gray-900">
                                Sign in as {currentConfig?.title}
                            </h1>
                            <p className="text-sm text-gray-500">{currentConfig?.description}</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 animate-in slide-in-from-top-2 duration-200">
                                {error}
                            </div>
                        )}

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        required
                                        className={`w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${currentConfig?.ring} ${currentConfig?.focusBorder} transition-all duration-200`}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        className={`w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${currentConfig?.ring} ${currentConfig?.focusBorder} transition-all duration-200`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Forgot Password Link */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    className={`text-sm ${currentConfig?.text} hover:opacity-80 font-medium transition-colors`}
                                >
                                    Forgot password?
                                </button>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3.5 bg-gradient-to-r ${currentConfig?.bgGradient} text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 focus:outline-none focus:ring-2 ${currentConfig?.ring} disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    `Sign In as ${currentConfig?.title}`
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">or continue with</span>
                            </div>
                        </div>

                        {/* Google Login Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <button className={`${currentConfig?.text} hover:opacity-80 font-semibold transition-colors`}>
                                Sign up
                            </button>
                        </p>
                    </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-gray-500 hover:text-gray-700 underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-gray-500 hover:text-gray-700 underline">Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
