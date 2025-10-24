'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { QrReader } from 'react-qr-reader';

interface RedemptionResult {
  status: 'SUCCESS' | 'INVALID' | 'USED' | 'EXPIRED' | 'INACTIVE';
  redemption_id?: string;
  inviter_name?: string;
  inviter_points?: number;
  referred_user_name?: string;
  points_awarded?: number;
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
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        toast.success('Code redeemed successfully!');
        setCode('');
      } else {
        setResult({ status: data.data?.status || 'INVALID' });
        toast.error(data.error || 'Failed to redeem code');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Cashier Interface</h1>
          <p className="text-gray-600">Scan QR or enter code to redeem</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={(result, error) => {
                if (!!result) {
                  setCode(result.getText().toUpperCase());
                }
              }}
              containerStyle={{ width: '100%' }}
            />
            <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 8-character code"
                className="w-full px-4 py-3 border rounded-lg text-center text-lg font-mono tracking-widest uppercase"
                maxLength={8}
                disabled={isLoading}
              />
              <Button onClick={handleRedeem} loading={isLoading} disabled={!code.trim() || isLoading} className="w-full" size="lg">
                {isLoading ? 'Verifying...' : 'Redeem Code'}
              </Button>
            </div>
          </CardContent>
        </Card>
        {result && (
          <Card className={result.status === 'SUCCESS' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Redemption Result</CardTitle>
                    <Badge variant={result.status === 'SUCCESS' ? 'success' : 'error'}>{result.status}</Badge>
                </div>
            </CardHeader>
            <CardContent>
              {result.status === 'SUCCESS' ? (
                <div className="space-y-3">
                  <p>Inviter: {result.inviter_name}</p>
                  <p>Points Awarded: +{result.points_awarded}</p>
                  <p>New Total: {result.inviter_points}</p>
                </div>
              ) : (
                <p>Invalid or expired code. Please try again.</p>
              )}
              <Button onClick={() => setResult(null)} variant="outline" className="w-full mt-4">
                Clear
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
