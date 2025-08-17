'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ReferralLinkDisplay from '@/components/ReferralLinkDisplay';

interface ReferralLink {
  id: string;
  slug: string;
  title: string;
}

export default function DashboardPage() {
  const [points, setPoints] = useState<number>(0);
  const [link, setLink] = useState<ReferralLink | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const pointsRes = await fetch('/api/points/me');
      if (pointsRes.ok) {
        const pointsJson = await pointsRes.json();
        setPoints(pointsJson.data?.current_points || 0);
      }
      const linkRes = await fetch('/api/referral/me');
      if (linkRes.ok) {
        const linkJson = await linkRes.json();
        setLink(linkJson.data || null);
      }
    };
    fetchData();
  }, []);

  const generate = async () => {
    setLoading(true);
    const res = await fetch('/api/referral/generate', { method: 'POST' });
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      setLink(json.data);
    }
  };

  const regenerate = async () => {
    setLoading(true);
    const res = await fetch('/api/referral/regenerate', { method: 'POST' });
    const json = await res.json();
    setLoading(false);
    if (res.ok) {
      setLink(json.data);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Points</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{points}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          {link ? (
            <ReferralLinkDisplay slug={link.slug} onRegenerate={regenerate} />
          ) : (
            <Button onClick={generate} loading={loading}>
              Generate Link
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
