import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Clock, Gift, User, Store, FileText } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { VerifyCodeResponse } from '@/types';

const CashierDashboard: React.FC = () => {
  const [code, setCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerifyCodeResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form fields for redemption
  const [cashierId, setCashierId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [notes, setNotes] = useState('');

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Masukkan kode hadiah terlebih dahulu');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      setVerificationResult(null);
      
      const result = await apiService.verifyCode(code.trim());
      setVerificationResult(result);
      
      if (result.status === 'VALID') {
        setSuccess('Kode valid! Hadiah dapat ditukarkan.');
      } else {
        setError(`Kode tidak valid: ${getStatusMessage(result.status)}`);
      }
    } catch (error) {
      console.error('Verification failed:', error);
      setError('Gagal memverifikasi kode. Silakan coba lagi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRedeem = async () => {
    if (!verificationResult || verificationResult.status !== 'VALID') {
      setError('Tidak dapat menukarkan hadiah yang tidak valid');
      return;
    }

    if (!cashierId.trim() || !storeId.trim()) {
      setError('ID Kasir dan ID Toko harus diisi');
      return;
    }

    try {
      setIsRedeeming(true);
      setError(null);
      
      await apiService.redeemReward(
        verificationResult.code,
        cashierId.trim(),
        storeId.trim(),
        notes.trim() || undefined
      );
      
      setSuccess('Hadiah berhasil ditukarkan!');
      setVerificationResult(null);
      setCode('');
      setCashierId('');
      setStoreId('');
      setNotes('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Redemption failed:', error);
      setError('Gagal menukarkan hadiah. Silakan coba lagi.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'VALID':
        return 'Kode valid dan dapat digunakan';
      case 'INVALID':
        return 'Kode tidak ditemukan';
      case 'EXPIRED':
        return 'Kode telah expired';
      case 'USED':
        return 'Kode sudah digunakan';
      default:
        return 'Status tidak diketahui';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'VALID':
        return 'text-green-600 bg-green-100';
      case 'INVALID':
        return 'text-red-600 bg-red-100';
      case 'EXPIRED':
        return 'text-yellow-600 bg-yellow-100';
      case 'USED':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'INVALID':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'EXPIRED':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'USED':
        return <XCircle className="w-6 h-6 text-gray-600" />;
      default:
        return <XCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Dashboard Kasir
          </h1>
          <p className="text-xl text-gray-600">
            Verifikasi dan tukarkan hadiah pelanggan dengan mudah
          </p>
        </motion.div>

        {/* Verification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Verifikasi Kode Hadiah
          </h2>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Masukkan kode hadiah (contoh: X7G9P2)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={isVerifying || !code.trim()}
              className="btn-primary flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Search className="w-5 h-5" />
              )}
              {isVerifying ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>{success}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="card p-8 mb-8"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Hasil Verifikasi
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(verificationResult.status)}
                  <span className="font-semibold text-gray-700">Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verificationResult.status)}`}>
                  {verificationResult.status}
                </span>
              </div>

              {/* Reward Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary-500" />
                  <span className="font-semibold text-gray-700">Hadiah</span>
                </div>
                <p className="text-gray-800">{verificationResult.reward.name}</p>
              </div>

              {/* Time Info */}
              {verificationResult.remainingTime !== undefined && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-secondary-500" />
                    <span className="font-semibold text-gray-700">Sisa Waktu</span>
                  </div>
                  <p className="text-2xl font-bold text-secondary-600">
                    {formatTime(verificationResult.remainingTime)}
                  </p>
                </div>
              )}

              {/* Claim Time */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-5 h-5 text-accent-500" />
                  <span className="font-semibold text-gray-700">Diklaim Pada</span>
                </div>
                <p className="text-gray-800">
                  {new Date(verificationResult.claimedAt).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Redemption Form - Only show if status is VALID */}
            {verificationResult.status === 'VALID' && (
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Form Penukaran Hadiah
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Kasir *
                    </label>
                    <input
                      type="text"
                      value={cashierId}
                      onChange={(e) => setCashierId(e.target.value)}
                      placeholder="Masukkan ID kasir"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Toko *
                    </label>
                    <input
                      type="text"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      placeholder="Masukkan ID toko"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan (Opsional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tambahkan catatan jika diperlukan"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming || !cashierId.trim() || !storeId.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedeeming ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  {isRedeeming ? 'Memproses...' : 'Tandai Telah Digunakan'}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-8"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Cara Penggunaan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Masukkan Kode</h4>
              <p className="text-sm text-gray-600">
                Masukkan kode hadiah yang diberikan pelanggan
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Verifikasi</h4>
              <p className="text-sm text-gray-600">
                Klik tombol verifikasi untuk memeriksa validitas kode
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">Tukarkan</h4>
              <p className="text-sm text-gray-600">
                Isi form dan tandai hadiah sebagai telah ditukarkan
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CashierDashboard;


