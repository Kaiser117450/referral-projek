// lib/storage.ts - Local file storage for receipts and documents
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage');
const RECEIPTS_DIR = path.join(STORAGE_DIR, 'receipts');

// Ensure storage directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(RECEIPTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directories:', error);
  }
}

// Initialize storage on module load
ensureDirectories();

export interface ReceiptData {
  redemption_id: string;
  code_id: string;
  inviter_id: string;
  referred_user_id: string;
  points_awarded: number;
  redeemed_by: string;
  redeemed_at: string;
  metadata?: Record<string, any>;
}

// Store receipt as JSON file
export async function storeReceipt(receiptData: ReceiptData): Promise<string> {
  try {
    const filename = `receipt_${receiptData.redemption_id}_${nanoid(8)}.json`;
    const filepath = path.join(RECEIPTS_DIR, filename);
    
    const receiptWithTimestamp = {
      ...receiptData,
      stored_at: new Date().toISOString(),
      file_id: filename,
    };

    await fs.writeFile(filepath, JSON.stringify(receiptWithTimestamp, null, 2), 'utf8');
    
    console.log(`Receipt stored: ${filename}`);
    return filename;
  } catch (error) {
    console.error('Error storing receipt:', error);
    throw new Error('Failed to store receipt');
  }
}

// Retrieve receipt by filename
export async function getReceipt(filename: string): Promise<ReceiptData | null> {
  try {
    const filepath = path.join(RECEIPTS_DIR, filename);
    const data = await fs.readFile(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error retrieving receipt:', error);
    return null;
  }
}

// List all receipts for a specific user (inviter)
export async function getUserReceipts(inviterId: string): Promise<ReceiptData[]> {
  try {
    const files = await fs.readdir(RECEIPTS_DIR);
    const receipts: ReceiptData[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const receipt = await getReceipt(file);
        if (receipt && receipt.inviter_id === inviterId) {
          receipts.push(receipt);
        }
      }
    }

    return receipts.sort((a, b) => 
      new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime()
    );
  } catch (error) {
    console.error('Error listing user receipts:', error);
    return [];
  }
}

// List all receipts for a specific cashier
export async function getCashierReceipts(cashierId: string): Promise<ReceiptData[]> {
  try {
    const files = await fs.readdir(RECEIPTS_DIR);
    const receipts: ReceiptData[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const receipt = await getReceipt(file);
        if (receipt && receipt.redeemed_by === cashierId) {
          receipts.push(receipt);
        }
      }
    }

    return receipts.sort((a, b) => 
      new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime()
    );
  } catch (error) {
    console.error('Error listing cashier receipts:', error);
    return [];
  }
}

// Delete receipt (admin only)
export async function deleteReceipt(filename: string): Promise<boolean> {
  try {
    const filepath = path.join(RECEIPTS_DIR, filename);
    await fs.unlink(filepath);
    console.log(`Receipt deleted: ${filename}`);
    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
}

// Get storage statistics
export async function getStorageStats() {
  try {
    const files = await fs.readdir(RECEIPTS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    let totalSize = 0;
    for (const file of jsonFiles) {
      const filepath = path.join(RECEIPTS_DIR, file);
      const stats = await fs.stat(filepath);
      totalSize += stats.size;
    }

    return {
      total_receipts: jsonFiles.length,
      total_size_bytes: totalSize,
      total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
      storage_directory: RECEIPTS_DIR,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      total_receipts: 0,
      total_size_bytes: 0,
      total_size_mb: '0.00',
      storage_directory: RECEIPTS_DIR,
    };
  }
}

// Cleanup old receipts (older than specified days)
export async function cleanupOldReceipts(daysOld: number = 90): Promise<number> {
  try {
    const files = await fs.readdir(RECEIPTS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filepath = path.join(RECEIPTS_DIR, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          deletedCount++;
        }
      }
    }

    console.log(`Cleaned up ${deletedCount} old receipts`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old receipts:', error);
    return 0;
  }
}

// Export receipt data as CSV (for admin reports)
export async function exportReceiptsAsCSV(startDate?: Date, endDate?: Date): Promise<string> {
  try {
    const files = await fs.readdir(RECEIPTS_DIR);
    const receipts: ReceiptData[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const receipt = await getReceipt(file);
        if (receipt) {
          const receiptDate = new Date(receipt.redeemed_at);
          
          if (startDate && receiptDate < startDate) continue;
          if (endDate && receiptDate > endDate) continue;
          
          receipts.push(receipt);
        }
      }
    }

    // Sort by date
    receipts.sort((a, b) => 
      new Date(a.redeemed_at).getTime() - new Date(b.redeemed_at).getTime()
    );

    // Generate CSV
    const headers = [
      'Redemption ID',
      'Code ID', 
      'Inviter ID',
      'Referred User ID',
      'Points Awarded',
      'Redeemed By',
      'Redeemed At'
    ];

    const csvRows = [
      headers.join(','),
      ...receipts.map(receipt => [
        receipt.redemption_id,
        receipt.code_id,
        receipt.inviter_id,
        receipt.referred_user_id,
        receipt.points_awarded,
        receipt.redeemed_by,
        receipt.redeemed_at
      ].join(','))
    ];

    return csvRows.join('\n');
  } catch (error) {
    console.error('Error exporting receipts as CSV:', error);
    throw new Error('Failed to export receipts');
  }
}