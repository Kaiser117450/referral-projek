'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';

interface RedemptionResult {
  status: 'SUCCESS' | 'INVALID' | 'USED' | 'EXPIRED' | 'INACTIVE';
  redemption_id?: string;
  inviter_name?: string;
  inviter_points?: number;
  referred_user_name?: string;
  points_awarded?: number;
  receipt_url?: string;
  unlocked_milestones?: any[];
}

export default function CashierPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RedemptionResult | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error('Please enter a code');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/redeem/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          redeemedBy: 'current-user-id', // This should come from auth context
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        toast.success('Code redeemed successfully!');
        setCode(''); // Clear input on success
      } else {
        setResult({
          status: data.data?.status || 'INVALID',
        });
        toast.error(data.error || 'Failed to redeem code');
      }
    } catch (error) {
      console.error('Error redeeming code:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge variant="success">SUCCESS</Badge>;
      case 'INVALID':
        return <Badge variant="error">INVALID</Badge>;
      case 'USED':
        return <Badge variant="warning">ALREADY USED</Badge>;
      case 'EXPIRED':
        return <Badge variant="error">EXPIRED</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">INACTIVE</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'Code redeemed successfully! Points have been awarded.';
      case 'INVALID':
        return 'The code you entered is invalid or does not exist.';
      case 'USED':
        return 'This code has already been used and cannot be redeemed again.';
      case 'EXPIRED':
        return 'This code has expired. Codes are valid for 5 minutes only.';
      case 'INACTIVE':
        return 'The referral link for this code is no longer active.';
      default:
        return 'An error occurred while processing the code.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cashier Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Redeem referral codes and award points to users
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Code Input Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Redeem Code
              </CardTitle>
              <CardDescription>
                Enter the 8-character code provided by the customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Referral Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg font-mono tracking-widest uppercase"
                    maxLength={8}
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  onClick={handleRedeem}
                  loading={isLoading}
                  disabled={!code.trim() || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Verifying...' : 'Redeem Code'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          {result && (
            <Card className={result.status === 'SUCCESS' ? 'border-success-200 bg-success-50' : 'border-error-200 bg-error-50'}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Redemption Result
                  </CardTitle>
                  {getStatusBadge(result.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  {getStatusMessage(result.status)}
                </p>

                {result.status === 'SUCCESS' && (
                  <div className="space-y-3 bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Inviter:</span>
                      <span className="text-gray-900">{result.inviter_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Referred User:</span>
                      <span className="text-gray-900">{result.referred_user_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Points Awarded:</span>
                      <span className="text-success-600 font-semibold">+{result.points_awarded}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">New Total:</span>
                      <span className="text-gray-900 font-semibold">{result.inviter_points}</span>
                    </div>
                    
                    {result.receipt_url && (
                      <div className="pt-3 border-t">
                        <a
                          href={result.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-700 text-sm font-medium inline-flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Receipt
                        </a>
                      </div>
                    )}

                    {result.unlocked_milestones && result.unlocked_milestones.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">🎉 New Milestones Unlocked!</p>
                        <div className="space-y-1">
                          {result.unlocked_milestones.map((milestone: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600">
                              • {milestone.name}: {milestone.reward}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={() => setResult(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Result
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Customer generates a referral code from their referral link</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Customer shows you the 8-character code (valid for 5 minutes)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Enter the code above and click "Redeem Code"</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>Points are automatically awarded to the referrer</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Codes are single-use and expire after 5 minutes. 
                  Each successful redemption awards 1 point to the referrer.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
