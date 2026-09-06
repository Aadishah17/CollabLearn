import React, { useState, useEffect } from 'react';
import {
  Star,
  Clock,
  Calendar,
  X,
  Plus,
  Trash2,
  Loader,
  Mail,
  BookOpen,
  Edit,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  GraduationCap,
  Layers,
} from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import EditProfile from './EditProfile';
import Avatar from './Avatar';
import { API_URL } from '../../config';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('skills');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 'Beginner',
  });

  // Predefined skills list
  const predefinedSkills = [
    'Java',
    'Python',
    'C/C++',
    'MongoDB',
    'Express',
    'React',
    'Node.js',
    'TypeScript',
    'TailwindCSS',
    'Machine Learning',
  ];

  const [profileData, setProfileData] = useState({
    name: '',
    joinDate: '',
    rating: { average: 0, count: 0 },
    bio: '',
    email: '',
    totalSessions: 0,
    avatar: '',
    isPremium: false,
    skillsOffering: [],
    skillsSeeking: [],
  });

  // Fetch user profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const profileRes = await profileResponse.json();

        // Fetch user skills separately
        const skillsResponse = await fetch(`${API_URL}/api/skills/my-skills`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        let userSkills = { skillsOffering: [], skillsSeeking: [] };
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          if (skillsData.success) {
            userSkills = skillsData.data;
          }
        }

        if (profileRes.success) {
          const user = profileRes.user;
          setProfileData({
            name: user.name || '',
            joinDate: user.joinDate
              ? new Date(user.joinDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })
              : '',
            rating: user.rating || { average: 0, count: 0 },
            bio: user.bio || '',
            email: user.email || '',
            totalSessions: user.totalSessions || 0,
            isPremium: user.isPremium || false,
            avatar:
              user.avatar ||
              'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
            skillsOffering: userSkills.skillsOffering || [],
            skillsSeeking: userSkills.skillsSeeking || [],
          });
        } else {
          setError(profileRes.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Error loading profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit') === 'true') {
        setShowEditProfile(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch user skills separately for dynamic updates
  const fetchSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const skillsResponse = await fetch(`${API_URL}/api/skills/my-skills`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        if (skillsData.success) {
          setProfileData((prev) => ({
            ...prev,
            skillsOffering: skillsData.data.skillsOffering || [],
            skillsSeeking: skillsData.data.skillsSeeking || [],
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  // Handle add skill form submission
  const handleAddSkill = async (e) => {
    e.preventDefault();

    if (!newSkill.name) {
      alert('Please fill in skill name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/skills/offering`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSkill.name,
          level: newSkill.level,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewSkill({ name: '', level: 'Beginner' });
        setShowAddSkillModal(false);
        await fetchSkills();
      } else {
        alert(data.message || 'Failed to add skill');
      }
    } catch (err) {
      console.error('Error adding skill:', err);
      alert('Error adding skill');
    }
  };

  // Delete an offering skill
  const deleteOfferingSkill = async (skillId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/skills/offering/${skillId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfileData((prev) => ({
          ...prev,
          skillsOffering: prev.skillsOffering.filter((skill) => skill._id !== skillId),
        }));
      } else {
        alert('Failed to delete skill: ' + data.message);
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
    }
  };

  // Delete a seeking skill
  const deleteSeekingSkill = async (skillId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/skills/seeking/${skillId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfileData((prev) => ({
          ...prev,
          skillsSeeking: prev.skillsSeeking.filter((skill) => skill._id !== skillId),
        }));
      } else {
        alert('Failed to delete skill: ' + data.message);
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
    }
  };

  const handleDeleteSkill = (skill) => {
    setSkillToDelete(skill);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (skillToDelete) {
      if (skillToDelete.isOffering) {
        await deleteOfferingSkill(skillToDelete._id);
      } else if (skillToDelete.isSeeking) {
        await deleteSeekingSkill(skillToDelete._id);
      }
    }
    setShowDeleteConfirm(false);
    setSkillToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSkillToDelete(null);
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response.');
      }

      const data = await response.json();

      if (data.success) {
        setProfileData((prev) => ({
          ...prev,
          name: data.user.name,
          bio: data.user.bio,
          avatar: data.user.avatar,
        }));

        if (data.user.name) {
          localStorage.setItem('username', data.user.name);
        }
        if (data.user.avatar) {
          localStorage.setItem('userAvatar', data.user.avatar);
        }

        window.dispatchEvent(
          new CustomEvent('profileUpdated', {
            detail: {
              name: data.user.name,
              email: data.user.email,
              avatar: data.user.avatar,
            },
          })
        );
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'Expert':
        return 'bg-gradient-to-r from-red-600/30 to-rose-600/20 text-red-300 border-red-500/40';
      case 'Advanced':
        return 'bg-gradient-to-r from-amber-600/30 to-orange-600/20 text-amber-300 border-amber-500/40';
      case 'Intermediate':
        return 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-white/10 text-gray-300 border-white/20';
    }
  };

  const tabs = [
    { id: 'skills', label: 'Skills & Capabilities', icon: BookOpen },
    { id: 'availability', label: 'Availability & Schedule', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="min-h-screen glass-page pt-20 flex items-center justify-center">
        <MainNavbar />
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
          <span className="text-sm font-mono tracking-widest text-red-400/80 uppercase">
            Loading Profile...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen glass-page pt-20 flex items-center justify-center">
        <MainNavbar />
        <div className="surface-card card-spotlight p-8 rounded-3xl border border-red-500/30 text-center max-w-md mx-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
            <X size={24} />
          </div>
          <div className="text-red-400 text-lg font-semibold mb-2">Failed to load profile</div>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="glass-cta px-6 py-2.5 text-sm font-semibold rounded-xl text-white cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen glass-page pt-20 pb-16 relative overflow-hidden">
      <MainNavbar />

      {/* Atmospheric Glow Orbs */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-[128px]"></div>
      <div className="pointer-events-none absolute top-1/3 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-[128px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Profile Hero Card */}
        <div className="surface-card card-spotlight rounded-3xl p-6 sm:p-8 mb-8 border border-white/10 backdrop-blur-xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {/* Subtle Ambient Gradient Banner */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-red-600/20 via-orange-600/10 to-transparent pointer-events-none border-b border-white/5"></div>

          <div className="relative pt-6 sm:pt-8 flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar with Cyber Halo */}
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative rounded-full ring-4 ring-black">
                  <Avatar
                    src={profileData.avatar}
                    name={profileData.name}
                    size="2xl"
                    className="shadow-2xl transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                {profileData.isPremium && (
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-to-br from-amber-400 to-amber-600 text-black rounded-full shadow-lg border-2 border-black">
                    <Crown size={16} className="fill-black" />
                  </div>
                )}
              </div>

              {/* User Identity Details */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {profileData.name}
                  </h1>
                  {profileData.isPremium ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-full shadow-inner">
                      <Crown size={13} className="fill-amber-300" />
                      PRO MEMBER
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-xs font-medium rounded-full">
                      Free Plan
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-400 mb-3">
                  {profileData.joinDate && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Calendar size={14} className="text-red-400" />
                      <span>Joined {profileData.joinDate}</span>
                    </div>
                  )}
                  {profileData.email && (
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Mail size={14} className="text-red-400" />
                      <span>{profileData.email}</span>
                    </div>
                  )}
                </div>

                {/* Rating Display */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className={`${
                          i < Math.floor(profileData.rating.average)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-white text-sm">
                    {profileData.rating.average.toFixed(1)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ({profileData.rating.count} reviews)
                  </span>
                </div>

                <p className="text-gray-300 text-sm max-w-2xl leading-relaxed">
                  {profileData.bio || 'No bio added yet. Click Edit Profile to introduce yourself!'}
                </p>
              </div>
            </div>

            {/* Quick Actions & High-Level Metric Tiles */}
            <div className="flex flex-col items-end gap-4 w-full md:w-auto mt-4 md:mt-0">
              <button
                onClick={() => setShowEditProfile(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-all shadow-lg hover:border-red-500/40 cursor-pointer"
              >
                <Edit size={16} className="text-red-400" />
                <span>Edit Profile</span>
              </button>

              <div className="grid grid-cols-2 gap-3 w-full sm:w-64">
                <div className="surface-card p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                    {profileData.totalSessions}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">
                    Sessions
                  </div>
                </div>
                <div className="surface-card p-3 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-400">
                    {profileData.skillsOffering.length}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-mono">
                    Offering
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cyber Navigation Tabs */}
        <div className="glass-panel p-1.5 rounded-2xl flex gap-2 border border-white/10 bg-white/[0.03] backdrop-blur-md mb-8 max-w-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-950/40 border border-red-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-gray-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Skills Ecosystem */}
        {activeTab === 'skills' && (
          <div className="space-y-8">
            {/* Skills I Offer */}
            <div className="surface-card card-spotlight rounded-3xl p-6 sm:p-8 border border-white/10 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Skills I Offer</h2>
                    <p className="text-xs text-gray-400">
                      Expertise you share with peers on CollabLearn
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddSkillModal(true)}
                  className="glass-cta flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Add Skill</span>
                </button>
              </div>

              {profileData.skillsOffering.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileData.skillsOffering.map((skill) => (
                    <div
                      key={skill._id}
                      className="surface-card border border-white/10 hover:border-red-500/40 p-5 rounded-2xl transition-all duration-300 group hover:-translate-y-1 relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                            {skill.name}
                          </h3>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLevelBadge(
                              skill.offering?.level || 'Beginner'
                            )}`}
                          >
                            {skill.offering?.level || 'Beginner'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSkill({ ...skill, isOffering: true })}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Layers size={13} className="text-gray-500" />
                          {skill.offering?.sessions || 0} sessions
                        </span>
                        <div className="flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span className="font-bold text-white">
                            {skill.offering?.rating || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <BookOpen size={40} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-300 font-medium">No skills offered yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Add Skill" above to start mentoring others!
                  </p>
                </div>
              )}
            </div>

            {/* Skills I'm Seeking */}
            <div className="surface-card card-spotlight rounded-3xl p-6 sm:p-8 border border-white/10 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Skills I'm Seeking</h2>
                  <p className="text-xs text-gray-400">
                    Topics you are actively learning and mastering
                  </p>
                </div>
              </div>

              {profileData.skillsSeeking.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileData.skillsSeeking.map((skill) => (
                    <div
                      key={skill._id}
                      className="surface-card border border-white/10 hover:border-orange-500/40 p-5 rounded-2xl transition-all duration-300 group hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                          {skill.name}
                        </h3>
                        <button
                          onClick={() => handleDeleteSkill({ ...skill, isSeeking: true })}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-gray-400">
                        {skill.seeking?.currentInstructor ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>
                              Instructor:{' '}
                              <strong className="text-white">
                                {typeof skill.seeking.currentInstructor === 'string'
                                  ? skill.seeking.currentInstructor
                                  : skill.seeking.currentInstructor.name || 'Instructor'}
                              </strong>
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-500 italic">No instructor matched yet</div>
                        )}

                        {skill.seeking?.preferredSchedule && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock size={13} className="text-gray-500" />
                            <span>{skill.seeking.preferredSchedule}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Sparkles size={40} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-300 font-medium">No learning goals set yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Explore matches from your dashboard to learn new skills!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Availability & Schedule */}
        {activeTab === 'availability' && (
          <div className="surface-card card-spotlight rounded-3xl p-6 sm:p-8 border border-white/10 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Peer Mentoring Availability</h2>
                  <p className="text-xs text-gray-400">
                    Your scheduled office hours for 1-on-1 collaborative sessions
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Accepting Sessions
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
              {[
                { day: 'Mon', active: true, times: ['18:00 - 20:00'] },
                { day: 'Tue', active: true, times: ['19:00 - 21:00'] },
                { day: 'Wed', active: false, times: [] },
                { day: 'Thu', active: true, times: ['18:00 - 20:00'] },
                { day: 'Fri', active: true, times: ['17:00 - 19:00'] },
                { day: 'Sat', active: true, times: ['10:00 - 14:00'] },
                { day: 'Sun', active: false, times: [] },
              ].map((slot) => (
                <div
                  key={slot.day}
                  className={`p-4 rounded-2xl border transition-all ${
                    slot.active
                      ? 'border-white/10 bg-white/[0.03] hover:border-red-500/40'
                      : 'border-white/5 bg-white/[0.01] opacity-50'
                  }`}
                >
                  <div className="text-sm font-bold text-white mb-2">{slot.day}</div>
                  {slot.active ? (
                    <div className="space-y-1">
                      {slot.times.map((t, idx) => (
                        <span
                          key={idx}
                          className="block text-[11px] font-mono text-red-300 bg-red-950/40 border border-red-500/20 px-2 py-1 rounded-lg"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-600 block italic">Unavailable</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <Clock size={16} className="text-amber-400" />
                <span>Timezone: Coordinated Universal Time (UTC+05:30 / Local Standard)</span>
              </div>
              <button
                onClick={() => alert('Availability scheduler preferences saved.')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Sync with Calendar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfile
        isOpen={showEditProfile}
        onClose={() => {
          setShowEditProfile(false);
          try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('edit')) {
              params.delete('edit');
              const base =
                window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
              window.history.replaceState({}, '', base);
            }
          } catch {
            // ignore
          }
        }}
        profileData={profileData}
        onSave={handleProfileUpdate}
      />

      {/* Add Skill Modal */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="surface-card card-spotlight border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                  <GraduationCap size={20} />
                </div>
                <h2 className="text-xl font-bold text-white">Add Offering Skill</h2>
              </div>
              <button
                onClick={() => setShowAddSkillModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Skill Name *
                </label>
                <select
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                  required
                >
                  <option value="" className="bg-gray-900 text-gray-400">
                    Select a skill...
                  </option>
                  {predefinedSkills.map((skill) => (
                    <option key={skill} value={skill} className="bg-gray-900 text-white">
                      {skill}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Proficiency Level *
                </label>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 transition-all text-sm"
                  required
                >
                  <option value="Beginner" className="bg-gray-900 text-white">
                    Beginner
                  </option>
                  <option value="Intermediate" className="bg-gray-900 text-white">
                    Intermediate
                  </option>
                  <option value="Advanced" className="bg-gray-900 text-white">
                    Advanced
                  </option>
                  <option value="Expert" className="bg-gray-900 text-white">
                    Expert
                  </option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSkillModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 glass-cta px-4 py-3 rounded-xl text-white font-semibold text-sm cursor-pointer"
                >
                  Add Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="surface-card card-spotlight border border-red-500/30 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-fade-in text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Delete Skill</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to remove{' '}
              <strong className="text-white">"{skillToDelete?.name}"</strong> from your profile?
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold cursor-pointer"
              >
                Keep Skill
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all shadow-lg shadow-red-950/40 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
