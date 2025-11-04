'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { QrReader } from 'react-qr-reader';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Gift, 
  Scan,
  KeyboardIcon,
  TrendingUp,
  Award
} from 'lucide-react';

interface RedemptionResult {
  status: 'SUCCESS' | 'INVALID' | 'USED' | 'EXPIRED' | 'INACTIVE';
  redemption_id?: string;
  inviter_name?: string;
  inviter_points?: number;
  referred_user_name?: string;
  points_awarded?: number;
  unlocked_milestones?: any[];
}

interface DailyStats {
  today_redemptions: number;
  today_points_awarded: number;
  active_session_time: string;
}

export default function CashierPage() {
  const { data: session, status } = useSession();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    today_redemptions: 0,
    today_points_awarded: 0,
    active_session_time: '0:00'
  });
  const [sessionStart] = useState(new Date());

  // Redirect if not authenticated or not cashier/admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
    if (session.user?.role !== 'cashier' && session.user?.role !== 'admin') {
      redirect('/dashboard');
    }
  }, [session, status]);

  // Update session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - sessionStart.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setDailyStats(prev => ({
        ...prev,
        active_session_time: `${hours}:${minutes.toString().padStart(2, '0')}`
      }));
    }, 60000);

    return () => clearInterval(timer);
  }, [sessionStart]);

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
        toast.success('🎉 Code redeemed successfully!');
        setCode('');
        // Update daily stats
        setDailyStats(prev => ({
          ...prev,
          today_redemptions: prev.today_redemptions + 1,
          today_points_awarded: prev.today_points_awarded + (data.data.points_awarded || 0)
        }));
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && code.trim()) {
      handleRedeem();
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cashier Terminal</h1>
                <p className="text-sm text-gray-600">Welcome, {session?.user?.name || 'Cashier'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Session: {dailyStats.active_session_time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Redemption Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Today's Redemptions</p>
                      <p className="text-2xl font-bold">{dailyStats.today_redemptions}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Points Awarded</p>
                      <p className="text-2xl font-bold">{dailyStats.today_points_awarded}</p>
                    </div>
                    <Award className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Code Input Interface */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-6 w-6" />
                  <span>Redeem Customer Code</span>
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Scan QR code or manually enter the 8-character redemption code
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Scanner Toggle */}
                <div className="flex space-x-2 mb-6">
                  <Button
                    variant={showScanner ? "default" : "outline"}
                    onClick={() => setShowScanner(true)}
                    className="flex-1"
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    QR Scanner
                  </Button>
                  <Button
                    variant={!showScanner ? "default" : "outline"}
                    onClick={() => setShowScanner(false)}
                    className="flex-1"
                  >
                    <KeyboardIcon className="h-4 w-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>

                {/* QR Scanner */}
                {showScanner && (
                  <div className="mb-6">
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50">
                      <QrReader
                        constraints={{ facingMode: 'environment' }}
                        onResult={(result, error) => {
                          if (!!result) {
                            setCode(result.getText().toUpperCase());
                            setShowScanner(false);
                            toast.success('QR code detected!');
                          }
                        }}
                        containerStyle={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}

                {/* Manual Input */}
                {!showScanner && (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter 8-character code"
                        className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-center text-2xl font-mono tracking-[0.3em] uppercase focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                        maxLength={8}
                        disabled={isLoading}
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {code.length}/8
                      </div>
                    </div>
                    <Button 
                      onClick={handleRedeem} 
                      disabled={!code.trim() || isLoading || code.length !== 8}
                      className="w-full py-4 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Verifying Code...
                        </>
                      ) : (
                        <>
                          <Gift className="h-5 w-5 mr-2" />
                          Redeem Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {result && (
              <Card className={`shadow-lg transition-all duration-300 ${
                result.status === 'SUCCESS' 
                  ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100' 
                  : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {result.status === 'SUCCESS' ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      <span>Redemption Result</span>
                    </CardTitle>
                    <Badge 
                      variant={result.status === 'SUCCESS' ? 'success' : 'destructive'}
                      className="text-sm px-3 py-1"
                    >
                      {result.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {result.status === 'SUCCESS' ? (
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-medium">{result.inviter_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Points Awarded:</span>
                            <span className="font-bold text-green-600">+{result.points_awarded}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">New Total:</span>
                            <span className="font-bold text-blue-600">{result.inviter_points} pts</span>
                          </div>
                          {result.redemption_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Receipt ID:</span>
                              <span className="font-mono text-xs">{result.redemption_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {result.unlocked_milestones && result.unlocked_milestones.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                            <Award className="h-4 w-4 mr-1" />
                            New Milestone Unlocked!
                          </h4>
                          {result.unlocked_milestones.map((milestone, index) => (
                            <p key={index} className="text-yellow-700 text-sm">
                              🎉 {milestone.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                      <p className="text-red-700 font-medium">
                        {result.status === 'EXPIRED' && 'Code has expired (5-minute limit)'}
                        {result.status === 'USED' && 'Code has already been used'}
                        {result.status === 'INVALID' && 'Invalid code format or not found'}
                        {result.status === 'INACTIVE' && 'Referral link is no longer active'}
                      </p>
                      <p className="text-red-600 text-sm mt-2">
                        Please ask the customer to generate a new code
                      </p>
                    </div>
                  )}
                  <Button 
                    onClick={() => {
                      setResult(null);
                      setCode('');
                    }} 
                    variant="outline" 
                    className="w-full mt-4"
                  >
                    Process Next Customer
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Help */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 text-lg">Quick Help</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-2">
                <p>• Codes expire after 5 minutes</p>
                <p>• Each code can only be used once</p>
                <p>• Customers earn 1 point per redemption</p>
                <p>• Press Enter to redeem after typing</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
