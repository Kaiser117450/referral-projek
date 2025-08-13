import { createClient, RedisClientType } from 'redis';
import { RedisTimerData } from '@/types';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;
  private memoryTimers = new Map<string, RedisTimerData>();
  private memoryReferrals = new Map<string, any>();

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      console.log('Redis Client Ready');
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
      } catch (error) {
        console.warn('Redis connection failed, using in-memory store');
        this.isConnected = false;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  /**
   * Store timer data with expiration
   */
  async storeTimer(code: string, data: RedisTimerData, expiresInSeconds = 900): Promise<void> {
    const key = `timer:${code}`;
    await this.connect();
    if (this.isConnected) {
      try {
        await this.client.setEx(key, expiresInSeconds, JSON.stringify(data));
      } catch (error) {
        console.error('Error storing timer in Redis:', error);
      }
    } else {
      this.memoryTimers.set(key, data);
      setTimeout(() => this.memoryTimers.delete(key), expiresInSeconds * 1000);
    }
  }

  /**
   * Get timer data
   */
  async getTimer(code: string): Promise<RedisTimerData | null> {
    const key = `timer:${code}`;
    await this.connect();
    if (this.isConnected) {
      try {
        const data = await this.client.get(key);
        if (!data) {
          return null;
        }
        return JSON.parse(data) as RedisTimerData;
      } catch (error) {
        console.error('Error getting timer from Redis:', error);
        return null;
      }
    } else {
      const data = this.memoryTimers.get(key);
      if (!data) {
        return null;
      }
      const now = Math.floor(Date.now() / 1000);
      if (data.expiresAt <= now) {
        this.memoryTimers.delete(key);
        return null;
      }
      return data;
    }
  }

  /**
   * Get remaining time for a timer
   */
  async getRemainingTime(code: string): Promise<number> {
    const key = `timer:${code}`;
    await this.connect();
    if (this.isConnected) {
      try {
        const ttl = await this.client.ttl(key);
        return ttl < 0 ? 0 : ttl;
      } catch (error) {
        console.error('Error getting remaining time from Redis:', error);
        return 0;
      }
    } else {
      const timer = await this.getTimer(code);
      if (!timer) {
        return 0;
      }
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, timer.expiresAt - now);
    }
  }

  /**
   * Delete a stored timer
   */
  async deleteTimer(code: string): Promise<void> {
    const key = `timer:${code}`;
    await this.connect();
    if (this.isConnected) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error('Error deleting timer from Redis:', error);
      }
    } else {
      this.memoryTimers.delete(key);
    }
  }

  /**
   * Store referral data temporarily
   */
  async storeReferralData(referralId: string, data: any, expiresInSeconds = 3600): Promise<void> {
    const key = `referral:${referralId}`;
    await this.connect();
    if (this.isConnected) {
      try {
        await this.client.setEx(key, expiresInSeconds, JSON.stringify(data));
      } catch (error) {
        console.error('Error storing referral data in Redis:', error);
      }
    } else {
      this.memoryReferrals.set(key, data);
      setTimeout(() => this.memoryReferrals.delete(key), expiresInSeconds * 1000);
    }
  }

  /**
   * Get referral data
   */
  async getReferralData(referralId: string): Promise<any | null> {
    const key = `referral:${referralId}`;
    await this.connect();
    if (this.isConnected) {
      try {
        const data = await this.client.get(key);
        if (!data) {
          return null;
        }
        return JSON.parse(data);
      } catch (error) {
        console.error('Error getting referral data from Redis:', error);
        return null;
      }
    } else {
      return this.memoryReferrals.get(key) ?? null;
    }
  }

  /**
   * Health check for Redis
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      if (this.isConnected) {
        await this.client.ping();
        return true;
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
    return false;
  }
}

// Export singleton instance
export const redisService = new RedisService();

