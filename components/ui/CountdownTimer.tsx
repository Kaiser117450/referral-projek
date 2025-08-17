import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string | Date;
  className?: string;
}

export function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
      const now = new Date();
      const difference = expiryDate.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        return;
      }

      setTimeLeft(difference);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (isExpired) return 'text-red-600';
    if (timeLeft < 60000) return 'text-orange-600'; // Less than 1 minute
    if (timeLeft < 300000) return 'text-yellow-600'; // Less than 5 minutes
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (isExpired) return <AlertTriangle className="h-4 w-4" />;
    if (timeLeft < 60000) return <Clock className="h-4 w-4 animate-pulse" />;
    return <Clock className="h-4 w-4" />;
  };

  if (isExpired) {
    return (
      <div className={cn('flex items-center space-x-2 text-red-600', className)}>
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Expired</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center space-x-2', getStatusColor(), className)}>
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
