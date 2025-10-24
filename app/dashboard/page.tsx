'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ReferralLinkDisplay from '@/components/ReferralLinkDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';

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
}

export default function DashboardPage() {
  const [points, setPoints] = useState<number>(0);
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const pointsRes = await fetch('/api/points/me');
      if (pointsRes.ok) {
        const pointsJson = await pointsRes.json();
        setPoints(pointsJson.data?.current_points || 0);
        setHistory(pointsJson.data?.points_history || []);
        setMilestones(pointsJson.data?.milestone_progress || []);
      }
      const linkRes = await fetch('/api/referral/me');
      if (linkRes.ok) {
        const linkJson = await linkRes.json();
        setLink(linkJson.data || null);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const generate = async () => {
    setLoading(true);
    const res = await fetch('/api/referral/generate', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      setLink(json.data);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Points</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{points}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          {link ? <ReferralLinkDisplay slug={link.slug} /> : <Button onClick={generate} loading={loading}>Generate Link</Button>}
        </CardContent>
      </Card>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>Points History</CardTitle></CardHeader>
            <CardContent>
              {history.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-semibold">{item.invite_title}</p>
                    <p className="text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${item.points > 0 ? 'text-green-500' : 'text-red-500'}`}>{item.points > 0 ? `+${item.points}` : item.points}</p>
                    <p className="text-sm text-gray-500">{item.status}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="milestones">
            <Card>
                <CardHeader><CardTitle>Milestone Progress</CardTitle></CardHeader>
                <CardContent>
                    {milestones.map((milestone) => (
                        <div key={milestone.id} className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-semibold">{milestone.name}</p>
                                <p className="text-sm text-gray-600">{milestone.points_required} PTS</p>
                            </div>
                            <Progress value={milestone.progress} />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
