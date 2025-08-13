import { createClient, RedisClientType } from 'redis';
import { RedisTimerData } from '@/types';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

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
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  /**
   * Store timer data in Redis with expiration
   */
  async storeTimer(code: string, data: RedisTimerData, expiresInSeconds: number = 900): Promise<void> {
    try {
      await this.connect();
      const key = `timer:${code}`;
      await this.client.setEx(key, expiresInSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing timer in Redis:', error);
      throw error;
    }
  }

  /**
   * Get timer data from Redis
   */
  async getTimer(code: string): Promise<RedisTimerData | null> {
    try {
      await this.connect();
      const key = `timer:${code}`;
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data) as RedisTimerData;
    } catch (error) {
      console.error('Error getting timer from Redis:', error);
      return null;
    }
  }

  /**
   * Get remaining TTL seconds for a timer
   */
  async getRemainingTime(code: string): Promise<number> {
    try {
      await this.connect();
      const key = `timer:${code}`;
      const ttl = await this.client.ttl(key);
      return ttl < 0 ? 0 : ttl;
    } catch (error) {
      console.error('Error getting remaining time from Redis:', error);
      return 0;
    }
  }

  /**
   * Delete a stored timer
   */
  async deleteTimer(code: string): Promise<void> {
    try {
      await this.connect();
      const key = `timer:${code}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting timer from Redis:', error);
    }
  }

  /**
   * Delete timer data from Redis
   */
  async deleteTimer(code: string): Promise<void> {
    try {
      await this.connect();
      const key = `timer:${code}`;
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting timer from Redis:', error);
      throw error;
    }
  }

  /**
   * Check if timer exists and is valid
   */
  async isTimerValid(code: string): Promise<boolean> {
    try {
      const timer = await this.getTimer(code);
      if (!timer) {
        return false;
      }

      const now = Math.floor(Date.now() / 1000);
      return timer.expiresAt > now;
    } catch (error) {
      console.error('Error checking timer validity:', error);
      return false;
    }
  }

  /**
   * Get remaining time for a timer
   */
  async getRemainingTime(code: string): Promise<number> {
    try {
      const timer = await this.getTimer(code);
      if (!timer) {
        return 0;
      }

      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, timer.expiresAt - now);
      return remaining;
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 0;
    }
  }

  /**
   * Store referral data temporarily
   */
  async storeReferralData(referralId: string, data: any, expiresInSeconds: number = 3600): Promise<void> {
    try {
      await this.connect();
      const key = `referral:${referralId}`;
      await this.client.setEx(key, expiresInSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing referral data in Redis:', error);
      throw error;
    }
  }

  /**
   * Get referral data
   */
  async getReferralData(referralId: string): Promise<any | null> {
    try {
      await this.connect();
      const key = `referral:${referralId}`;
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting referral data from Redis:', error);
      return null;
    }
  }

  /**
   * Health check for Redis
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();


