'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Mail, ArrowRight, AlertCircle, CheckCircle, Utensils } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkSession();

    // Handle error messages
    if (error) {
      switch (error) {
        case 'insufficient_permissions':
          toast.error('You do not have permission to access that page');
          break;
        case 'Signin':
          toast.error('Sign in failed. Please try again.');
          break;
        default:
          toast.error('An error occurred during sign in');
      }
    }
  }, [router, error]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/dashboard'
      });

      if (result?.error) {
        toast.error('Failed to send sign-in email. Please try again.');
      } else {
        setEmailSent(true);
        toast.success('Check your email for the sign-in link!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Restaurant Branding */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Utensils className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your F&B Referral Account
          </p>
        </div>

        <Card className="shadow-xl">
          <div className="p-8">
            {!emailSent ? (
              <form onSubmit={handleEmailSignIn} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter your email address"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 py-3 text-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Sign-in Link...
                    </>
                  ) : (
                    <>
                      Send Sign-in Link
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Check Your Email!
                  </h3>
                  <p className="text-green-700 text-sm">
                    We've sent a sign-in link to <strong>{email}</strong>
                  </p>
                  <p className="text-green-600 text-sm mt-2">
                    Click the link in your email to sign in to your account.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                    }}
                  >
                    Use Different Email
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => handleEmailSignIn({ preventDefault: () => {} } as React.FormEvent)}
                    disabled={loading}
                  >
                    Resend Email
                  </Button>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">First time here?</p>
                  <p>Just enter your email above. If you don't have an account yet, we'll create one for you automatically when you click the sign-in link.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </div>
        </Card>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="mailto:support@yourrestaurant.com" className="font-medium text-orange-600 hover:text-orange-500">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
