import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/slices/authStore';
import { userService } from '../services/cricketSocialService';
import { Link } from 'react-router-dom';
import type { User } from '../types';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile().then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['myStats', user?.id],
    queryFn: () => userService.getStats(user!.id).then((r) => r.data),
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: (data: Partial<User>) => userService.updateProfile(data),
    onSuccess: (res) => {
      updateUser(res.data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const startEditing = () => {
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      city: profile?.city || '',
      country: profile?.country || '',
      battingStyle: profile?.battingStyle || '',
      bowlingStyle: profile?.bowlingStyle || '',
      playerRole: profile?.playerRole || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark shadow-lg">
        <div className="max-w-full mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-white/80 hover:text-white flex items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link to="/" className="flex items-center gap-2">
                <img src="/images/cs-logo.png" alt="CricketSocial" className="h-8" />
                <span className="text-white font-bold text-lg hidden sm:block">CricketSocial</span>
              </Link>
            </div>
            <h2 className="text-white font-semibold">My Profile</h2>
            <div className="w-24" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto pt-20 px-4 pb-8">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-2 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-brand-green to-brand-dark rounded-2xl p-8 text-white mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold border-4 border-white/30 shadow-lg">
                {displayUser?.profileImageUrl ? (
                  <img src={displayUser.profileImageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <>{displayUser?.firstName?.[0]}{displayUser?.lastName?.[0]}</>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white text-brand-green rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold">{displayUser?.firstName} {displayUser?.lastName}</h1>
              <p className="text-green-200 mt-1">{displayUser?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                {displayUser?.playerRole && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{displayUser.playerRole}</span>
                )}
                {displayUser?.city && displayUser?.country && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">📍 {displayUser.city}, {displayUser.country}</span>
                )}
                {displayUser?.battingStyle && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">🏏 {displayUser.battingStyle}</span>
                )}
                {displayUser?.bowlingStyle && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">⚾ {displayUser.bowlingStyle}</span>
                )}
              </div>
            </div>

            {!isEditing && (
              <button onClick={startEditing} className="bg-white text-brand-green px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">{stats?.totalMatches || 0}</p>
              <p className="text-green-200 text-sm mt-1">Matches</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">{stats?.totalRuns || 0}</p>
              <p className="text-green-200 text-sm mt-1">Runs</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">{stats?.totalWickets || 0}</p>
              <p className="text-green-200 text-sm mt-1">Wickets</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-bold">{stats?.highestScore || 0}</p>
              <p className="text-green-200 text-sm mt-1">Highest Score</p>
            </div>
          </div>
        </div>

        {/* Edit Form or Profile Details */}
        {isEditing ? (
          <div className="card animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                <input
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                <input
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <input
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input-field"
                  placeholder="e.g. India"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Batting Style</label>
                <select
                  value={formData.battingStyle || ''}
                  onChange={(e) => setFormData({ ...formData, battingStyle: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Right Hand">Right Hand Bat</option>
                  <option value="Left Hand">Left Hand Bat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bowling Style</label>
                <select
                  value={formData.bowlingStyle || ''}
                  onChange={(e) => setFormData({ ...formData, bowlingStyle: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Right Arm Fast">Right Arm Fast</option>
                  <option value="Right Arm Medium">Right Arm Medium</option>
                  <option value="Right Arm Off Spin">Right Arm Off Spin</option>
                  <option value="Right Arm Leg Spin">Right Arm Leg Spin</option>
                  <option value="Left Arm Fast">Left Arm Fast</option>
                  <option value="Left Arm Medium">Left Arm Medium</option>
                  <option value="Left Arm Spin">Left Arm Spin</option>
                  <option value="Left Arm Chinaman">Left Arm Chinaman</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Player Role</label>
                <select
                  value={formData.playerRole || ''}
                  onChange={(e) => setFormData({ ...formData, playerRole: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicket Keeper">Wicket Keeper</option>
                  <option value="WK Batsman">WK Batsman</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {updateProfile.isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h3>
              <div className="space-y-4">
                <InfoRow label="Full Name" value={`${displayUser?.firstName} ${displayUser?.lastName}`} />
                <InfoRow label="Email" value={displayUser?.email} />
                <InfoRow label="City" value={displayUser?.city || '—'} />
                <InfoRow label="Country" value={displayUser?.country || '—'} />
              </div>
            </div>

            {/* Cricket Info */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <img src="/images/batsman.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                Cricket Profile
              </h3>
              <div className="space-y-4">
                <InfoRow label="Player Role" value={displayUser?.playerRole || '—'} />
                <InfoRow label="Batting Style" value={displayUser?.battingStyle || '—'} />
                <InfoRow label="Bowling Style" value={displayUser?.bowlingStyle || '—'} />
              </div>
            </div>

            {/* Batting Stats */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <img src="/images/batsman.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                Batting Statistics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Matches" value={stats?.totalMatches || 0} />
                <StatBox label="Runs" value={stats?.totalRuns || 0} />
                <StatBox label="Average" value={stats?.battingAverage?.toFixed(1) || '—'} />
                <StatBox label="Strike Rate" value={stats?.strikeRate?.toFixed(1) || '—'} />
                <StatBox label="100s" value={stats?.centuries || 0} />
                <StatBox label="50s" value={stats?.halfCenturies || 0} />
                <StatBox label="Highest" value={stats?.highestScore || 0} highlight />
              </div>
            </div>

            {/* Bowling Stats */}
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <img src="/images/ball3.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                Bowling Statistics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <StatBox label="Wickets" value={stats?.totalWickets || 0} />
                <StatBox label="Average" value={stats?.bowlingAverage?.toFixed(1) || '—'} />
                <StatBox label="Economy" value={stats?.economyRate?.toFixed(1) || '—'} />
                <StatBox label="5W Hauls" value={stats?.fiveWicketHauls || 0} />
                <StatBox label="Best" value={stats?.bestBowling || '—'} highlight />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value || '—'}</span>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-brand-green/10 border border-brand-green/20' : 'bg-gray-50'}`}>
      <p className={`text-xl font-bold ${highlight ? 'text-brand-green' : 'text-gray-800'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
