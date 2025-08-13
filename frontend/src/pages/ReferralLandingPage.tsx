import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Coffee, Star } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { RewardData } from '@/types';

const ReferralLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidRef, setIsValidRef] = useState<boolean | null>(null);
  const [validationMsg, setValidationMsg] = useState<string>('');

  useEffect(() => {
    if (code) {
      validateReferral(code);
      loadRewards();
    }
  }, [code]);

  const loadRewards = async () => {
    try {
      setIsLoading(true);
      const availableRewards = await apiService.getAvailableRewards();
      setRewards(availableRewards);
    } catch (error) {
      console.error('Failed to load rewards:', error);
      setError('Gagal memuat hadiah yang tersedia');
    } finally {
      setIsLoading(false);
    }
  };

  const validateReferral = async (refCode: string) => {
    try {
      const data = await apiService.getReferralByCode(refCode);
      if (data) {
        setIsValidRef(true);
        setValidationMsg('Kode referral valid. Klaim hadiah sekarang!');
      } else {
        setIsValidRef(false);
        setValidationMsg('Kode referral tidak ditemukan.');
      }
    } catch (e) {
      setIsValidRef(false);
      setValidationMsg('Kode referral tidak valid atau terjadi kesalahan.');
    }
  };

  const handleClaimReward = (rewardId: string) => {
    navigate(`/claim/${rewardId}?ref=${code}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
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
            onClick={() => window.location.href = '/'}
            className="btn-primary"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center pt-12 pb-8 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Gift className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Selamat Datang di{' '}
            <span className="gradient-text">GrowthLoop!</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Teman Anda telah mengundang Anda untuk bergabung! 
            Klaim hadiah gratis sekarang dan nikmati pengalaman luar biasa.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 inline-block">
            <p className="text-sm text-gray-500 mb-1">Kode Referral</p>
            <p className="text-2xl font-bold font-mono text-primary-600">
              {code}
            </p>
          </div>

          {isValidRef !== null && (
            <div className={`mt-4 px-4 py-2 rounded-lg inline-block ${isValidRef ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {validationMsg}
            </div>
          )}
        </div>
      </motion.div>

      {/* Rewards Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="px-4 pb-12"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Hadiah yang Tersedia
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="card p-6 hover:scale-105 transition-transform duration-300"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Coffee className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {reward.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {reward.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-500">
                      {reward.pointsRequired === 0 ? 'Gratis' : `${reward.pointsRequired} poin`}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleClaimReward(reward.id)}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isValidRef === false}
                  >
                    Klaim Hadiah Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/60 backdrop-blur-sm py-16 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Mengapa Memilih GrowthLoop?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">🎁</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Hadiah Instan
              </h3>
              <p className="text-gray-600">
                Dapatkan hadiah langsung tanpa menunggu lama
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Proses Cepat
              </h3>
              <p className="text-gray-600">
                Klaim hadiah dalam hitungan menit
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Aman & Terpercaya
              </h3>
              <p className="text-gray-600">
                Sistem keamanan tingkat tinggi untuk melindungi Anda
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="py-16 px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Siap Klaim Hadiah?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Pilih hadiah favorit Anda dan mulai perjalanan menarik bersama GrowthLoop!
          </p>
          
          {rewards.length > 0 && (
            <button
              onClick={() => handleClaimReward(rewards[0].id)}
              className="btn-primary text-lg px-8 py-4"
            >
              Mulai Sekarang
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ReferralLandingPage;


