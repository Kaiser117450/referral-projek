'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatPoints, formatDate } from '@/lib/utils';
import { Trophy, Users, TrendingUp, Gift, Copy, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PointsData {
  current_points: number;
  total_points_earned: number;
  points_history: Array<{
    points: number;
    date: string;
    status: string;
    invite_title: string;
  }>;
  milestone_progress: Array<{
    id: string;
    name: string;
    description: string;
    points_required: number;
    reward_description: string;
    is_unlocked: boolean;
    unlocked_at: string | null;
    progress: number;
  }>;
  next_milestone: {
    name: string;
    points_required: number;
    points_needed: number;
    progress: number;
  } | null;
}

interface MilestonesData {
  milestones: Array<{
    id: string;
    name: string;
    description: string;
    points_required: number;
    reward_description: string;
    status: string;
    is_unlocked: boolean;
    unlocked_at: string | null;
    progress: number;
    points_needed: number;
  }>;
  next_milestone: {
    name: string;
    points_required: number;
    points_needed: number;
    progress: number;
  } | null;
  recent_unlocks: Array<{
    milestone_id: string;
    name: string;
    description: string;
    reward: string;
    unlocked_at: string;
    points_required: number;
  }>;
  statistics: {
    total_milestones: number;
    unlocked_milestones: number;
    locked_milestones: number;
    overall_progress: number;
    current_points: number;
  };
}

interface ReferralData {
  invites: Array<{
    id: string;
    title: string;
    description: string;
    slug: string;
    max_uses: number;
    current_uses: number;
    is_active: boolean;
    created_at: string;
  }>;
  referrals: Array<{
    id: string;
    invitee_email: string;
    status: string;
    created_at: string;
    invite: {
      title: string;
      slug: string;
    };
  }>;
  total_referrals: number;
  successful_referrals: number;
}

export default function DashboardPage() {
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [milestonesData, setMilestonesData] = useState<MilestonesData | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'referrals'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch points data
      const pointsResponse = await fetch('/api/points/me');
      if (pointsResponse.ok) {
        const pointsResult = await pointsResponse.json();
        setPointsData(pointsResult.data);
      }
      
      // Fetch milestones data
      const milestonesResponse = await fetch('/api/milestones/me');
      if (milestonesResponse.ok) {
        const milestonesResult = await milestonesResponse.json();
        setMilestonesData(milestonesResult.data);
      }
      
      // Fetch referral data
      const referralResponse = await fetch('/api/referral');
      if (referralResponse.ok) {
        const referralResult = await referralResponse.json();
        setReferralData(referralResult.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateReferralLink = (slug: string) => {
    return `${window.location.origin}/invite/${slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your referrals and rewards</p>
            </div>
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => window.location.href = '/referral/create'}
            >
              Create New Invite
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'milestones', label: 'Milestones', icon: Trophy },
              { id: 'referrals', label: 'Referrals', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Current Points</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPoints(pointsData?.current_points || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Earned</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPoints(pointsData?.total_points_earned || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {referralData?.total_referrals || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Gift className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Milestones</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {milestonesData?.statistics.unlocked_milestones || 0}/{milestonesData?.statistics.total_milestones || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Milestone */}
            {pointsData?.next_milestone && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span>Next Milestone</span>
                  </CardTitle>
                  <CardDescription>
                    {pointsData.next_milestone.points_needed} more points to unlock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>{pointsData.next_milestone.name}</span>
                        <span>{pointsData.next_milestone.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pointsData.next_milestone.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {pointsData.current_points} / {pointsData.next_milestone.points_required} points
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest points and referral activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pointsData?.points_history.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            +{formatPoints(item.points)} points
                          </p>
                          <p className="text-sm text-gray-600">{item.invite_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                        <Badge variant="success" size="sm">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-6">
            {/* Overall Progress */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Milestone Progress</CardTitle>
                <CardDescription>
                  Overall progress: {milestonesData?.statistics.overall_progress || 0}% complete
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${milestonesData?.statistics.overall_progress || 0}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{milestonesData?.statistics.total_milestones || 0}</p>
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{milestonesData?.statistics.unlocked_milestones || 0}</p>
                    <p className="text-sm text-gray-600">Unlocked</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{milestonesData?.statistics.locked_milestones || 0}</p>
                    <p className="text-sm text-gray-600">Locked</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{milestonesData?.statistics.current_points || 0}</p>
                    <p className="text-sm text-gray-600">Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {milestonesData?.milestones.map((milestone) => (
                <Card 
                  key={milestone.id} 
                  variant={milestone.is_unlocked ? "elevated" : "outlined"}
                  className={milestone.is_unlocked ? "border-primary/20 bg-primary/5" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{milestone.name}</CardTitle>
                      {milestone.is_unlocked ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Unlocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          <Clock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                          <span>Progress</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              milestone.is_unlocked ? 'bg-green-500' : 'bg-primary'
                            }`}
                            style={{ width: `${milestone.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Points Required</p>
                          <p className="font-medium">{formatPoints(milestone.points_required)}</p>
                        </div>
                        {!milestone.is_unlocked && (
                          <div>
                            <p className="text-gray-600">Points Needed</p>
                            <p className="font-medium">{formatPoints(milestone.points_needed)}</p>
                          </div>
                        )}
                      </div>

                      {milestone.is_unlocked && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800">Reward Unlocked!</p>
                          <p className="text-sm text-green-700">{milestone.reward_description}</p>
                          {milestone.unlocked_at && (
                            <p className="text-xs text-green-600 mt-1">
                              Unlocked on {formatDate(milestone.unlocked_at)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Unlocks */}
            {milestonesData?.recent_unlocks.length > 0 && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Recently Unlocked</CardTitle>
                  <CardDescription>Your latest achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestonesData.recent_unlocks.map((unlock) => (
                      <div key={unlock.milestone_id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Trophy className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-800">{unlock.name}</p>
                          <p className="text-sm text-green-700">{unlock.reward}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600">{formatDate(unlock.unlocked_at)}</p>
                          <p className="text-xs text-green-600">{formatPoints(unlock.points_required)} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <p className="text-3xl font-bold text-gray-900">{referralData?.total_referrals || 0}</p>
                  <p className="text-gray-600">Total Referrals</p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-gray-900">{referralData?.successful_referrals || 0}</p>
                  <p className="text-gray-600">Successful</p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-gray-900">
                    {referralData?.total_referrals ? 
                      Math.round((referralData.successful_referrals / referralData.total_referrals) * 100) : 0
                    }%
                  </p>
                  <p className="text-gray-600">Success Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Invites */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Active Invites</CardTitle>
                <CardDescription>Your current referral invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralData?.invites.filter(invite => invite.is_active).map((invite) => (
                    <div key={invite.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{invite.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{invite.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>Uses: {invite.current_uses}/{invite.max_uses}</span>
                            <span>Created: {formatDate(invite.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generateReferralLink(invite.slug))}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Referral Link</p>
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 text-sm bg-white px-3 py-2 rounded border">
                            {generateReferralLink(invite.slug)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(generateReferralLink(invite.slug))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {referralData?.invites.filter(invite => invite.is_active).length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No active invites</p>
                      <Button 
                        variant="primary" 
                        className="mt-4"
                        onClick={() => window.location.href = '/referral/create'}
                      >
                        Create Your First Invite
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Referral History */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>Track all your referral attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {referralData?.referrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          referral.status === 'COMPLETED' ? 'bg-green-100' : 
                          referral.status === 'PENDING' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {referral.status === 'COMPLETED' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : referral.status === 'PENDING' ? (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referral.invitee_email}</p>
                          <p className="text-sm text-gray-600">{referral.invite.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            referral.status === 'COMPLETED' ? 'success' : 
                            referral.status === 'PENDING' ? 'warning' : 'secondary'
                          }
                          size="sm"
                        >
                          {referral.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(referral.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  
                  {referralData?.referrals.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No referrals yet</p>
                      <p className="text-sm text-gray-400 mt-1">Start inviting friends to see them here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
