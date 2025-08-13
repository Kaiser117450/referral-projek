import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Copy, CheckCircle, AlertCircle, Gift, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { ClaimRewardResponse } from '@/types';

const ClaimPage: React.FC = () => {
  const { rewardId } = useParams<{ rewardId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref');
  
  const [claimData, setClaimData] = useState<ClaimRewardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isUsed, setIsUsed] = useState(false);

  useEffect(() => {
    if (rewardId && refCode) {
      claimReward();
    }
  }, [rewardId, refCode]);

  useEffect(() => {
    if (claimData && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [claimData, timeLeft]);

  // Poll status to detect USED/EXPIRED while user keeps page open
  useEffect(() => {
    if (!claimData) return;
    const poll = setInterval(async () => {
      try {
        const res = await apiService.verifyCode(claimData.rewardCode);
        if (res.status === 'USED') setIsUsed(true);
        if (res.status === 'EXPIRED') setIsExpired(true);
        if (typeof res.remainingTime === 'number' && res.remainingTime >= 0) {
          setTimeLeft(res.remainingTime);
        }
      } catch (_) {
        // ignore transient errors
      }
    }, 10000);
    return () => clearInterval(poll);
  }, [claimData]);

  const claimReward = async () => {
    try {
      setIsLoading(true);
      const result = await apiService.claimReward(refCode!, rewardId!);
      setClaimData(result);
      setTimeLeft(result.timerMinutes * 60); // Convert minutes to seconds
    } catch (error) {
      console.error('Failed to claim reward:', error);
      setError('Gagal mengklaim hadiah. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (claimData) {
      try {
        await navigator.clipboard.writeText(claimData.rewardCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    if (timeLeft <= 60) return 'text-red-500';
    return 'text-green-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Memproses klaim hadiah...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Oops!</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!claimData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Data Tidak Ditemukan</h1>
          <p className="text-red-500 mb-4">Tidak dapat memuat data klaim hadiah</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animate-gradient bg-gradient-to-r from-primary-100 via-secondary-100 to-accent-100 opacity-30"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="pt-8 px-4"
        >
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Gift className="w-12 h-12 text-white" />
              </motion.div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Hadiah Berhasil Diklaim! 🎉
              </h1>
              
              <p className="text-xl text-gray-600 mb-6">
                Anda telah berhasil mengklaim hadiah. 
                Simpan kode di bawah ini dan tunjukkan kepada kasir.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Timer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 flex items-center justify-center px-4 py-8"
        >
          <div className="max-w-2xl mx-auto w-full">
            {/* Timer Display */}
            <div className="card p-8 mb-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Clock className="w-8 h-8 text-primary-500" />
                <h2 className="text-2xl font-bold text-gray-800">Waktu Tersisa</h2>
              </div>
              
              <div className={`timer-display ${getTimeColor()} mb-4`}>
                {formatTime(timeLeft)}
              </div>
              
              <p className="text-gray-600">
                {isExpired 
                  ? 'Waktu telah habis. Kode tidak dapat digunakan lagi.' 
                  : 'Kode harus digunakan sebelum waktu habis!'
                }
              </p>
            </div>

            {/* Status Badge */}
            <div className="mb-4 text-center">
              {isUsed && (
                <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold">SUDAH DIGUNAKAN</span>
              )}
              {!isUsed && isExpired && (
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 text-sm font-semibold">EXPIRED</span>
              )}
            </div>

            {/* QR Preview (if available) */}
            {claimData.qrUrl && (
              <div className="card p-8 text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">QR Kode</h3>
                <div className="flex justify-center">
                  <div className="relative inline-block">
                    <img src={claimData.qrUrl} alt="QR Kode" className={`w-48 h-48 object-contain ${isExpired || isUsed ? 'opacity-60' : ''}`} />
                    {(isExpired || isUsed) && (
                      <span className={`absolute inset-0 flex items-center justify-center text-white text-sm font-bold ${isUsed ? 'bg-gray-800/60' : 'bg-yellow-600/60'}`}>
                        {isUsed ? 'SUDAH DIGUNAKAN' : 'EXPIRED'}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mt-4">Tunjukkan QR ini ke kasir untuk dipindai</p>
              </div>
            )}

            {/* Reward Code */}
            <div className="card p-8 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Kode Hadiah Anda
              </h3>
              
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-1 rounded-lg mb-6">
                <div className="bg-white p-6 rounded-lg">
                  <span className="reward-code">
                    {claimData.rewardCode}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Tunjukkan kode atau QR ini kepada kasir untuk menukarkan hadiah Anda
              </p>
              
              <button
                onClick={copyCode}
                className="btn-secondary flex items-center gap-2 mx-auto"
                disabled={isExpired || isUsed}
              >
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Tersalin!' : 'Salin Kode'}
              </button>
            </div>

            {/* Reward Details */}
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                Detail Hadiah
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Nama Hadiah</p>
                  <p className="font-semibold text-gray-800">{claimData.reward.name}</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Kategori</p>
                  <p className="font-semibold text-gray-800">{claimData.reward.category}</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Penting!</p>
                    <p>
                      Kode ini hanya berlaku selama {claimData.timerMinutes} menit. Pastikan Anda menukarkannya segera setelah diklaim. Setelah waktu habis, kode tidak dapat digunakan lagi. QR tetap tampil untuk bukti, namun statusnya akan menjadi EXPIRED.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="pb-8 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-500 text-sm">
              © 2024 GrowthLoop. Semua hak dilindungi.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClaimPage;


