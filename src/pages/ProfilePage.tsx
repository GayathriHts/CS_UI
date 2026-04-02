import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/slices/authStore';
import { userService } from '../services/cricketSocialService';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import type { User } from '../types';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editOriginal, setEditOriginal] = useState<Partial<User>>({});

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userService.getProfile().then((r) => r.data),
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
    const initial = {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      city: profile?.city || '',
      country: profile?.country || '',
      battingStyle: profile?.battingStyle || '',
      bowlingStyle: profile?.bowlingStyle || '',
      playerRole: profile?.playerRole || '',
    };
    setFormData(initial);
    setEditOriginal(initial);
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
      <Navbar title="My Profile" backTo="/dashboard" />

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
                 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <input
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input-field"
                 
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
                onClick={() => {
                  const hasChanges = formData.firstName !== editOriginal.firstName || formData.lastName !== editOriginal.lastName || formData.city !== editOriginal.city || formData.country !== editOriginal.country || formData.battingStyle !== editOriginal.battingStyle || formData.bowlingStyle !== editOriginal.bowlingStyle || formData.playerRole !== editOriginal.playerRole;
                  if (hasChanges) { setShowCancelConfirm(true); return; }
                  setIsEditing(false);
                }}
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


          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm mx-4 animate-fade-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Discard Changes?</h3>
              <p className="text-xs text-gray-500 mb-4">You have unsaved changes. Are you sure you want to discard them?</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm">No, Keep Editing</button>
                <button onClick={() => { setShowCancelConfirm(false); setIsEditing(false); }} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors text-sm">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
