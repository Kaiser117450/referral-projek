'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import CountdownTimer from '@/components/ui/CountdownTimer';

interface CodeGeneratorProps {
  inviteId: string;
  inviteTitle: string;
}

export default function CodeGenerator({ inviteId, inviteTitle }: CodeGeneratorProps) {
  const supabase = createClientComponentClient();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Please login to generate a code');
        return;
      }
      const res = await fetch('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, referredUserId: user.id })
      });
      const result = await res.json();
      if (result.success) {
        setCode(result.data.code);
        setExpiresAt(result.data.expiresAt);
      } else {
        setMessage(result.error || 'Failed to generate code');
      }
    } catch (err) {
      setMessage('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  if (code) {
    return (
      <div className="space-y-4 text-center">
        <div>
          <p className="text-sm text-gray-600">Kode untuk {inviteTitle}</p>
          <p className="text-4xl font-mono font-bold tracking-widest">{code}</p>
        </div>
        {expiresAt && (
          <div className="flex justify-center">
            <CountdownTimer expiresAt={expiresAt} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      {message && <p className="text-sm text-red-600">{message}</p>}
      <Button onClick={generate} loading={loading}>
        Generate Code
      </Button>
    </div>
  );
}
