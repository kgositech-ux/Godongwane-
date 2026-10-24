import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  Building,
  Save,
  CheckCircle2,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, isAdmin, updateUserProfileData, logout } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [statusText, setStatusText] = useState('');
  const [role, setRole] = useState<UserRole>('project_manager');
  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDepartment(userProfile.department || 'Executive Management & Operations');
      setPhone(userProfile.phone || '+27 (0) 83 987 6543');
      setBio(userProfile.bio || 'Structural engineering, stainless steel fabrication oversight, and project coordination.');
      setStatusText(userProfile.statusText || 'Active on site & workshop');
      setRole(userProfile.role || 'project_manager');
    } else if (currentUser) {
      setDisplayName(
        currentUser.displayName ||
        (currentUser.email === 'servicewebsites6@gmail.com'
          ? 'mthethwapraisegodcebolenkosi'
          : currentUser.email?.split('@')[0] || 'User')
      );
      setDepartment('Executive Management & Operations');
      setPhone('+27 (0) 83 987 6543');
      setBio('Structural engineering, stainless steel fabrication oversight, and project coordination.');
      setStatusText('Active on site & workshop');
      setRole(isAdmin ? 'admin' : 'project_manager');
    }
  }, [userProfile, currentUser, isAdmin, isOpen]);

  if (!isOpen) return null;

  const displayEmail =
    currentUser?.email && currentUser.email !== 'servicewebsites6@gmail.com'
      ? currentUser.email
      : 'mthethwapraisegodcebolenkosi@gmail.com';

  const avatarInitial = (displayName || displayEmail).charAt(0).toUpperCase();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSavedSuccess(false);

    try {
      await updateUserProfileData({
        displayName: displayName.trim(),
        department: department.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        statusText: statusText.trim(),
        role: isAdmin ? role : userProfile?.role || 'project_manager',
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0d131f]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/20">
              {avatarInitial}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>User Profile Settings</span>
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Admin
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {displayEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>User profile updated successfully across all Godongwane services.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Name / Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Praise-God Cebolenkosi Mthethwa"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +27 (0) 83 987 6543"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Operational Department</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Structural Engineering & Fabrication"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">System Role</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <select
                  disabled={!isAdmin}
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-60"
                >
                  <option value="admin">Enterprise Administrator</option>
                  <option value="project_manager">Lead Project Manager</option>
                  <option value="collaborator">Engineering Collaborator</option>
                  <option value="employee">Workshop Fabricator / Staff</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Workplace Availability / Status</label>
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="e.g. Active in Wadeville Fabrication Facility"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Professional Bio & Experience</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Technical certifications, specialty metals experience, project management background..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
            />
          </div>

          {/* Enterprise details summary pill */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Godongwane Enterprise Credentials</span>
            </div>
            <p>
              Organization: <span className="text-white font-medium">Godongwane Progressive Projects</span> • Email:{' '}
              <span className="text-amber-400 font-mono">{displayEmail}</span>
            </p>
          </div>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                logout();
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
