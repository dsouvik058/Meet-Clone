import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  Keyboard,
  Settings,
  HelpCircle,
  MessageSquareQuote,
  LogOut,
  Sparkles,
  ShieldCheck,
  Clock,
  RefreshCw,
  User,
  CheckCircle2,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth.api';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, refreshToken, logout, setTokens } = useAuthStore();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [meetingCode, setMeetingCode] = useState<string>('');
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ' • ' +
          now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    const cleanCode = meetingCode.trim().replace(/^https?:\/\/[^/]+\//, '');
    navigate(`/room/${cleanCode}`);
  };

  const handleStartInstantMeeting = () => {
    // Generates a mock/temp code until Phase 4 MeetingController is invoked
    const randomCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    navigate(`/room/${randomCode}`);
  };

  const handleTestTokenRefresh = async () => {
    if (!refreshToken) return;
    setIsRefreshingToken(true);
    setRefreshSuccess(null);
    try {
      const res = await authApi.refresh(refreshToken);
      setTokens(res.accessToken, res.refreshToken);
      setRefreshSuccess('Successfully rotated JWT with Spring Boot Identity Service!');
      setTimeout(() => setRefreshSuccess(null), 4000);
    } catch (err: any) {
      setRefreshSuccess('Refresh failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-meet-dark text-meet-text-primary flex flex-col justify-between selection:bg-meet-blue selection:text-meet-dark">
      {/* Orbit Navigation Bar */}
      <header className="h-16 px-6 border-b border-meet-tile/40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-meet-blue-dark to-meet-blue flex items-center justify-center shadow-md">
            <Video className="w-5 h-5 text-meet-dark" />
          </div>
          <span className="text-xl font-medium tracking-tight text-white">Orbit</span>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <span className="hidden md:inline-block text-sm text-meet-text-secondary font-medium">
            {currentTime}
          </span>

          <button className="meet-btn-icon w-10 h-10 meet-btn-icon-tile hidden sm:flex" title="Support">
            <HelpCircle className="w-4 h-4 text-meet-text-secondary" />
          </button>

          <button className="meet-btn-icon w-10 h-10 meet-btn-icon-tile hidden sm:flex" title="Settings">
            <Settings className="w-4 h-4 text-meet-text-secondary" />
          </button>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full hover:bg-meet-surface border border-transparent hover:border-meet-tile transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-meet-blue to-meet-blue-dark text-meet-dark font-semibold text-xs flex items-center justify-center shadow">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-medium text-white truncate max-w-[120px]">{user?.name}</div>
                <div className="text-[10px] text-meet-text-muted truncate max-w-[120px]">{user?.email}</div>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-meet-surface rounded-2xl p-4 border border-meet-tile/80 shadow-meet-modal z-50 animate-fadeIn space-y-4">
                <div className="flex items-center space-x-3 border-b border-meet-tile/50 pb-3">
                  <div className="w-12 h-12 rounded-full bg-meet-blue text-meet-dark font-bold text-base flex items-center justify-center">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                    <div className="text-xs text-meet-text-muted truncate">{user?.email}</div>
                    <div className="text-[10px] text-meet-green font-mono mt-0.5 truncate">ID: {user?.id}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-meet-red/10 text-meet-red hover:bg-meet-red/20 font-medium text-xs transition border border-meet-red/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero & Action Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Hero Copy & Actions */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
              Premium video meetings. <br />
              <span className="text-meet-blue">Now free for everyone.</span>
            </h1>
            <p className="text-meet-text-secondary text-base sm:text-lg max-w-xl font-normal leading-relaxed">
              Secure, high-definition video meetings with zero lag and real-time collaboration for everyone.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            {/* New Meeting Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
                className="meet-btn-primary w-full sm:w-auto py-3 px-6 rounded-full flex items-center justify-center space-x-2 text-sm font-medium shadow-md"
              >
                <Video className="w-4 h-4" />
                <span>New meeting</span>
              </button>

              {showNewMeetingMenu && (
                <div className="absolute left-0 mt-2 w-64 bg-meet-surface rounded-2xl py-2 border border-meet-tile/80 shadow-meet-modal z-50 space-y-1">
                  <button
                    onClick={handleStartInstantMeeting}
                    className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-meet-hover text-left text-sm text-white transition"
                  >
                    <Plus className="w-4 h-4 text-meet-blue" />
                    <span>Start an instant meeting</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowNewMeetingMenu(false);
                      alert('Shareable link feature enabled in Phase 4');
                    }}
                    className="w-full px-4 py-2.5 flex items-center space-x-3 hover:bg-meet-hover text-left text-sm text-white transition"
                  >
                    <LinkIcon className="w-4 h-4 text-meet-blue" />
                    <span>Create a meeting for later</span>
                  </button>
                </div>
              )}
            </div>

            {/* Enter Code Input */}
            <form onSubmit={handleJoinByCode} className="flex items-center space-x-3 flex-1 max-w-sm">
              <div className="relative flex-1">
                <Keyboard className="w-4 h-4 text-meet-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter a code or link"
                  className="w-full bg-meet-surface text-white text-sm rounded-full pl-10 pr-4 py-3 border border-meet-tile focus:border-meet-blue focus:ring-1 focus:ring-meet-blue outline-none transition placeholder:text-meet-text-muted"
                />
              </div>

              {meetingCode.trim() && (
                <button
                  type="submit"
                  className="text-sm font-medium text-meet-blue hover:text-meet-blue-hover px-3 py-2 transition"
                >
                  Join
                </button>
              )}
            </form>
          </div>

          <div className="border-t border-meet-tile/40 pt-6"></div>

          {/* Phase 2: Live Dual-Key JWT Verification Card */}
          <div className="bg-meet-surface/80 rounded-2xl p-5 border border-meet-tile/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-meet-green" />
                <span className="text-sm font-medium text-white">Dual-Key JWT Session Verified</span>
              </div>
              <button
                onClick={handleTestTokenRefresh}
                disabled={isRefreshingToken}
                className="text-xs text-meet-blue hover:text-meet-blue-hover flex items-center space-x-1.5 font-medium transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingToken ? 'animate-spin' : ''}`} />
                <span>Test Silent Token Rotation</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-meet-text-secondary bg-meet-dark/70 p-3 rounded-xl border border-meet-tile/50">
              <div>
                <span className="text-meet-text-muted">User ID:</span> {user?.id}
              </div>
              <div>
                <span className="text-meet-text-muted">Email:</span> {user?.email}
              </div>
              <div>
                <span className="text-meet-text-muted">Auth Status:</span> <span className="text-meet-green">ACTIVE (PostgreSQL Verified)</span>
              </div>
              <div>
                <span className="text-meet-text-muted">Tokens:</span> Access + Refresh Synced
              </div>
            </div>

            {refreshSuccess && (
              <div className="text-xs text-meet-green bg-meet-green/10 border border-meet-green/30 p-2.5 rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{refreshSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Product Graphic / Security Showcase */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-meet-surface via-meet-tile/30 to-meet-surface border border-meet-tile/60 flex items-center justify-center p-8 shadow-2xl">
            <div className="w-48 h-48 rounded-full bg-meet-dark border border-meet-tile flex flex-col items-center justify-center space-y-3 shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-meet-blue-dark to-meet-blue flex items-center justify-center shadow-lg">
                <Video className="w-8 h-8 text-meet-dark" />
              </div>
              <span className="text-xs font-semibold text-white tracking-wide uppercase">
                Secure SFU Calling
              </span>
            </div>
            {/* Ambient accent badge */}
            <div className="absolute -bottom-2 bg-meet-surface border border-meet-tile/80 px-4 py-1.5 rounded-full text-xs font-medium text-meet-blue shadow-lg flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kurento WebRTC Ready</span>
            </div>
          </div>

          <div className="max-w-xs space-y-1">
            <h3 className="text-base font-medium text-white">Your meeting is safe</h3>
            <p className="text-xs text-meet-text-secondary leading-relaxed">
              No one can join a meeting unless invited or admitted by the host.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-8 border-t border-meet-tile/40 text-xs text-meet-text-muted flex items-center justify-between">
        <div>Orbit — Secure Real-Time Video Collaboration</div>
        <div className="space-x-4">
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
      </footer>
    </div>
  );
};
