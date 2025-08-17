import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import CodeGenerator from '@/components/CodeGenerator';

interface Params {
  slug: string;
}

export default async function ReferralSlugPage({ params }: { params: Params }) {
  const supabase = createServerClient();
  const { data: invite, error } = await supabase
    .from('invites')
    .select('id, title, description, is_active')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();

  if (error || !invite) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{invite.title}</CardTitle>
          {invite.description && <CardDescription>{invite.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <CodeGenerator inviteId={invite.id} inviteTitle={invite.title} />
        </CardContent>
      </Card>
    </div>
  );
}
