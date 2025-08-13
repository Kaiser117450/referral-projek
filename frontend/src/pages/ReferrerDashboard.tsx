import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, Award, TrendingUp, Copy, CheckCircle } from 'lucide-react';
import { useReferralStore } from '@/store/referral.store';
import { apiService } from '@/services/api.service';
import { DemoReferralStats, GenerateLinkResponse, PointsResponse } from '@/types';

const ReferrerDashboard: React.FC = () => {
  const { 
    demoReferralCode, 
    demoStats, 
    setDemoStats, 
    isLoading, 
    setLoading 
  } = useReferralStore();
  
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [points, setPoints] = useState<PointsResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    loadDemoStats();
    generateLinkAndPoints();
  }, []);

  const loadDemoStats = async () => {
    try {
      setLoading(true);
      const stats = await apiService.getDemoStats();
      setDemoStats(stats);
    } catch (error) {
      console.error('Failed to load demo stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    try {
      const referralLink = shareUrl || `${window.location.origin}/ref/${demoReferralCode}`;
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral code:', error);
    }
  };

  const shareReferral = async () => {
    try {
      const referralLink = shareUrl || `${window.location.origin}/ref/${demoReferralCode}`;
      const shareData = {
        title: 'Join GrowthLoop!',
        text: 'Get free rewards when you join using my referral link!',
        url: referralLink,
      };
      
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyReferralCode();
      }
    } catch (error) {
      console.error('Failed to share referral:', error);
    }
  };

  const generateLinkAndPoints = async () => {
    try {
      setIsGenerating(true);
      const link: GenerateLinkResponse = await apiService.generateLink();
      setShareUrl(link.shareUrl);
      const inviterId = link.referralCode; // initial phase: inviterId == referralCode
      const pts = await apiService.getPoints(inviterId);
      setPoints(pts);
    } catch (e) {
      // non-blocking
    } finally {
      setIsGenerating(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold gradient-text mb-4">
            GrowthLoop
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Platform referral marketing modern untuk bisnis dan pelanggan. 
            Undang teman, dapatkan poin, dan nikmati hadiah menarik!
          </p>
        </motion.div>

        {/* Referral Code Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
        >
          {/* Referral Code Card */}
          <motion.div variants={itemVariants} className="card p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Kode Referral Anda
              </h2>
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 p-1 rounded-lg mb-6">
                 <div className="bg-white p-4 rounded-lg">
                  <span className="text-3xl font-bold font-mono tracking-wider gradient-text">
                    {shareUrl ? shareUrl.split('/').pop() : demoReferralCode}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                {shareUrl ? `Bagikan link ini: ${shareUrl}` : 'Bagikan kode ini kepada teman-teman Anda untuk mendapatkan poin dan hadiah!'}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={copyReferralCode}
                  className="btn-secondary flex items-center gap-2"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Tersalin!' : 'Salin Link'}
                </button>
                <button
                  onClick={shareReferral}
                  className="btn-primary flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Bagikan
                </button>
                <button
                  onClick={generateLinkAndPoints}
                  className="btn-secondary flex items-center gap-2"
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Membuat...' : 'Generate Link Baru'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Card */}
          <motion.div variants={itemVariants} className="card p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Statistik Cepat
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary-500" />
                  <span className="text-gray-700">Total Referral</span>
                </div>
                <span className="text-2xl font-bold text-primary-600">
                  {demoStats?.totalReferrals || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-secondary-500" />
                  <span className="text-gray-700">Total Poin</span>
                </div>
                <span className="text-2xl font-bold text-secondary-600">
                  {points?.points ?? demoStats?.totalPoints ?? 0}
                </span>
              </div>
              {points && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-700 font-semibold">Milestone Berikutnya</div>
                      <div className="text-blue-900">{points.nextMilestone ?? 'Maksimum'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-700 font-semibold">Sisa Poin</div>
                      <div className="text-blue-900">{points.pointsToNext ?? 0}</div>
                    </div>
                  </div>
                  {points.nextMilestone && (
                    <div className="mt-3 w-full bg-blue-100 h-2 rounded">
                      <div
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${Math.min(100, Math.round((points.points / points.nextMilestone) * 100))}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-accent-500" />
                  <span className="text-gray-700">Conversion Rate</span>
                </div>
                <span className="text-2xl font-bold text-accent-600">
                  {demoStats?.conversionRate || 0}%
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Detailed Stats */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Statistik Detail
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {demoStats?.successfulReferrals || 0}
              </div>
              <div className="text-gray-600">Referral Berhasil</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg">
              <div className="text-4xl font-bold text-secondary-600 mb-2">
                {demoStats?.pendingReferrals || 0}
              </div>
              <div className="text-gray-600">Menunggu Klaim</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg">
              <div className="text-4xl font-bold text-accent-600 mb-2">
                {demoStats?.pointsThisMonth || 0}
              </div>
              <div className="text-gray-600">Poin Bulan Ini</div>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="card p-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Bagaimana Cara Kerjanya?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Bagikan Kode Referral
              </h3>
              <p className="text-gray-600">
                Bagikan kode referral Anda kepada teman-teman
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Teman Klaim Hadiah
              </h3>
              <p className="text-gray-600">
                Teman Anda mengklaim hadiah dengan kode unik
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Dapatkan Poin
              </h3>
              <p className="text-gray-600">
                Anda mendapatkan poin untuk setiap referral berhasil
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReferrerDashboard;


