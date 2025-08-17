'use client';

import { CopyButton } from '@/components/CopyButton';
import { Button } from '@/components/ui/Button';
import { useMemo } from 'react';

interface ReferralLinkDisplayProps {
  slug: string;
  onRegenerate: () => Promise<void>;
}

export default function ReferralLinkDisplay({ slug, onRegenerate }: ReferralLinkDisplayProps) {
  const url = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/r/${slug}`;
  }, [slug]);

  return (
    <div className="space-y-2">
      <code className="block p-2 bg-gray-100 rounded break-all">{url}</code>
      <div className="flex space-x-2">
        <CopyButton value={url} label="Copy Link" />
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          Regenerate Link
        </Button>
      </div>
    </div>
  );
}
