'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import ReferralLinkDisplay from '@/components/ReferralLinkDisplay';
import CodeGenerator from '@/components/CodeGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Star, 
  Gift, 
  Users, 
  TrendingUp, 
  Award, 
  Clock, 
  Share2,
  Trophy,
  Target,
  Calendar,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReferralLink {
  id: string;
  slug: string;
  title: string;
}

interface PointsHistory {
    points: number;
    date: string;
    status: string;
    invite_title: string;
}

interface MilestoneProgress {
    id: number;
    name: string;
    points_required: number;
    is_unlocked: boolean;
    progress: number;
    reward_type: string;
    reward_value: any;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [points, setPoints] = useState<number>(0);
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
  const [stats, setStats] = useState({
    total_referrals: 0,
    successful_redemptions: 0,
    this_month_points: 0,
    next_milestone_points: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/login');
    }
  }, [session, status]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch points and history
        const pointsRes = await fetch('/api/points/me');
        if (pointsRes.ok) {
          const pointsJson = await pointsRes.json();
          setPoints(pointsJson.data?.current_points || 0);
          setHistory(pointsJson.data?.points_history || []);
          setStats(prev => ({
            ...prev,
            successful_redemptions: pointsJson.data?.points_history?.length || 0,
            this_month_points: pointsJson.data?.this_month_points || 0
          }));
        }

        // Fetch referral link
        const linkRes = await fetch('/api/referral/me');
        if (linkRes.ok) {
          const linkJson = await linkRes.json();
          setLink(linkJson.data || null);
        }

        // Fetch milestones
        const milestonesRes = await fetch('/api/milestones/me');
        if (milestonesRes.ok) {
          const milestonesJson = await milestonesRes.json();
          setMilestones(milestonesJson.data?.milestones || []);
          
          // Calculate next milestone
          const nextMilestone = milestonesJson.data?.milestones?.find((m: MilestoneProgress) => !m.is_unlocked);
          if (nextMilestone) {
            setStats(prev => ({
              ...prev,
              next_milestone_points: nextMilestone.points_required - points
            }));
          }
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchData();
    }
  }, [session, points]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/referral/generate', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setLink(json.data);
        toast.success('Referral link generated!');
      } else {
        toast.error('Failed to generate referral link');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
                <p className="text-gray-600">
                  {session?.user?.name || session?.user?.email || 'Valued Customer'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Your Points</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {points}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Points</p>
                      <p className="text-2xl font-bold">{points}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Redemptions</p>
                      <p className="text-2xl font-bold">{stats.successful_redemptions}</p>
                    </div>
                    <Gift className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">This Month</p>
                      <p className="text-2xl font-bold">{stats.this_month_points}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Next Goal</p>
                      <p className="text-2xl font-bold">{stats.next_milestone_points > 0 ? stats.next_milestone_points : '🎉'}</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Referral Link Section */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Share2 className="h-6 w-6" />
                  <span>Your Referral Link</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {link ? (
                  <div className="space-y-4">
                    <ReferralLinkDisplay slug={link.slug} />
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">How it works:</h4>
                      <ol className="text-sm text-orange-700 space-y-1">
                        <li>1. Share your referral link with friends</li>
                        <li>2. They visit our restaurant using your link</li>
                        <li>3. They generate a code and show it to our cashier</li>
                        <li>4. You earn points when they redeem the code!</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Referring Friends!</h3>
                    <p className="text-gray-600 mb-4">Generate your unique referral link to start earning points</p>
                    <Button 
                      onClick={generate} 
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      size="lg"
                    >
                      {loading ? 'Generating...' : 'Generate My Link'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="history" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history" className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>History</span>
                </TabsTrigger>
                <TabsTrigger value="milestones" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Milestones</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Points History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {history.length > 0 ? (
                      <div className="space-y-4">
                        {history.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-100 p-2 rounded-full">
                                <Gift className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{item.invite_title}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(item.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600 text-lg">+{item.points}</p>
                              <Badge variant="success" className="text-xs">
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No History Yet</h3>
                        <p className="text-gray-600">Start referring friends to see your points history here!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5" />
                      <span>Milestone Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="relative">
                          <div className={`p-4 rounded-lg border-2 transition-all ${
                            milestone.is_unlocked 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-white'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${
                                  milestone.is_unlocked 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {milestone.is_unlocked ? (
                                    <Award className="h-5 w-5" />
                                  ) : (
                                    <Target className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                                  <p className="text-sm text-gray-600">
                                    {milestone.points_required} points required
                                  </p>
                                </div>
                              </div>
                              {milestone.is_unlocked && (
                                <Badge variant="success" className="flex items-center space-x-1">
                                  <Trophy className="h-3 w-3" />
                                  <span>Unlocked!</span>
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.min(points, milestone.points_required)}/{milestone.points_required}</span>
                              </div>
                              <Progress 
                                value={milestone.progress} 
                                className={milestone.is_unlocked ? 'bg-green-200' : ''}
                              />
                            </div>

                            {milestone.reward_value && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800">
                                  🎁 Reward: {JSON.parse(milestone.reward_value).description || 'Special reward'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Code Generator */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-6 w-6" />
                  <span>Generate Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {link ? (
                  <CodeGenerator inviteId={link.id} />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 text-sm">Generate your referral link first to create codes</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Pro Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800 space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <p>Share your link on social media for maximum reach</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <p>Codes expire in 5 minutes, so generate them when ready to use</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <p>Each successful referral earns you 1 point towards rewards</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
