'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { Alert } from '@/components/ui/Alert';
import { Logo } from '@/components/ui/Logo';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'admin'
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [success, setSuccess] = useState(false);
    const { signup, loading, error, clearError } = useAuth();
    const router = useRouter();

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.fullName) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, number and special character';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setSuccess(false);

        if (!validateForm()) {
            return;
        }

        const success = await signup(
            formData.email,
            formData.password,
            formData.fullName,
            formData.role
        );

        if (success) {
            setSuccess(true);
            setTimeout(() => {
                router.push('/auth/login');
            }, 2000);
        }
    };

    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Logo in top left corner */}
            <div className="fixed top-6 left-6 z-10">
                <Logo size="md" />
            </div>

            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Create Admin Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or{' '}
                        <Link
                            href="/auth/login"
                            className="font-medium text-blue-400 hover:text-blue-300"
                        >
                            sign in to your existing account
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {error && (
                            <Alert
                                type="danger"
                                title="Signup Failed"
                                description={error}
                                onClose={clearError}
                            />
                        )}

                        {success && (
                            <Alert
                                type="success"
                                title="Account Created!"
                                description="Account created successfully! Redirecting to login..."
                            />
                        )}

                        <InputField
                            id="fullName"
                            type="text"
                            label="Full Name"
                            value={formData.fullName}
                            onChange={handleInputChange('fullName')}
                            placeholder="System Administrator"
                            required
                            error={errors.fullName}
                        />

                        <InputField
                            id="email"
                            type="email"
                            label="Email Address"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            placeholder="admin@driveorbit.com"
                            required
                            error={errors.email}
                        />

                        <div className="space-y-1">
                            <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                                Role <span className="text-red-400 ml-1">*</span>
                            </label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={handleInputChange('role')}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="admin">Admin</option>
                                <option value="super-admin">Super Admin</option>
                                <option value="moderator">Moderator</option>
                            </select>
                        </div>

                        <InputField
                            id="password"
                            type="password"
                            label="Password"
                            value={formData.password}
                            onChange={handleInputChange('password')}
                            placeholder="Create a strong password"
                            required
                            error={errors.password}
                        />

                        <InputField
                            id="confirmPassword"
                            type="password"
                            label="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange('confirmPassword')}
                            placeholder="Confirm your password"
                            required
                            error={errors.confirmPassword}
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            id="agree-terms"
                            name="agree-terms"
                            type="checkbox"
                            required
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-800 rounded"
                        />
                        <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-300">
                            I agree to the{' '}
                            <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
                                Terms of Service
                            </a>{' '}
                            and{' '}
                            <a href="#" className="font-medium text-blue-400 hover:text-blue-300">
                                Privacy Policy
                            </a>
                        </label>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        loading={loading}
                        disabled={success}
                        className="w-full"
                    >
                        Create Account
                    </Button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-900 text-gray-400">
                                DriveOrbit Admin Portal
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
