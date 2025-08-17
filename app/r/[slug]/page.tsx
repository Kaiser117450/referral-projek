import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { CopyButton } from '@/components/CopyButton';
import { generateRandomCode, generateSalt, hashCode, calculateExpiryTime } from '@/lib/utils';

interface Params {
  slug: string;
}

export default async function VisitorPage({ params }: { params: Params }) {
  const supabase = createServerClient();
  const { data: invite } = await supabase
    .from('invites')
    .select('id, user_id, title, description, max_uses, current_uses, is_active')
    .eq('slug', params.slug)
    .single();

  if (!invite || !invite.is_active || invite.current_uses >= invite.max_uses) {
    notFound();
  }

  const code = generateRandomCode(6);
  const salt = generateSalt();
  const codeHash = await hashCode(code, salt);
  const expiresAt = calculateExpiryTime(5).toISOString();

  await supabase.from('ephemeral_codes').insert({
    user_id: invite.user_id,
    code_hash: codeHash,
    salt,
    expires_at: expiresAt,
    status: 'ACTIVE',
    invite_id: invite.id,
  });

  await supabase
    .from('invites')
    .update({ current_uses: invite.current_uses + 1, is_active: false })
    .eq('id', invite.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>{invite.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-mono font-bold tracking-widest">{code}</p>
          <CountdownTimer expiresAt={expiresAt} className="justify-center" />
          <CopyButton value={code} label="Copy Code" />
        </CardContent>
      </Card>
    </div>
  );
}
