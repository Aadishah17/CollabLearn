import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Share2,
  Bookmark,
  Download,
  ThumbsUp,
  Play,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  FileText,
  User,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { API_URL } from '../../config';

const CoursePlayer = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('curriculum');
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await fetch(`${API_URL}/api/courses/${id}`);
        const data = await response.json();
        if (data.success) {
          setCourse(data.course);
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen glass-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
          <span className="text-sm font-mono tracking-widest text-red-400/80 uppercase">
            Loading Cinema Experience...
          </span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen glass-page flex items-center justify-center p-4">
        <div className="surface-card card-spotlight p-8 rounded-3xl border border-white/10 text-center max-w-md">
          <h2 className="text-xl font-bold text-white mb-2">Course Not Found</h2>
          <p className="text-gray-400 text-sm mb-6">
            The course session you requested might have been moved or removed.
          </p>
          <Link
            to="/courses"
            className="glass-cta inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
          >
            <ChevronLeft size={16} /> Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // Mock curriculum chapters based on course data
  const chapters = [
    { id: 1, title: '01. Course Overview & Prerequisites', duration: '08:15', completed: true },
    { id: 2, title: `02. Core Fundamentals of ${course.title}`, duration: '18:40', current: true },
    { id: 3, title: '03. Architecture & Pattern Breakdown', duration: '24:10', completed: false },
    { id: 4, title: '04. Hands-on Project Implementation', duration: '35:20', completed: false },
    { id: 5, title: '05. Production Deployment & Wrap-Up', duration: '14:50', completed: false },
  ];

  return (
    <div className="min-h-screen glass-page text-white flex flex-col relative overflow-hidden">
      {/* Ambient Radial Spotlight */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px]"></div>

      {/* Top Cinema Bar */}
      <nav className="h-16 px-4 sm:px-6 bg-black/60 backdrop-blur-xl border-b border-white/10 flex items-center justify-between sticky top-0 z-50">
        <Link
          to="/courses"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group text-sm font-medium"
        >
          <ChevronLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform text-red-400"
          />
          <span>Back to Catalog</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span className="font-semibold text-sm truncate max-w-xs sm:max-w-md text-white">
            {course.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {copiedToast && (
            <span className="text-xs font-mono text-emerald-400 animate-fade-in bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              Link Copied!
            </span>
          )}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
            title="Share Course"
          >
            <Share2 size={16} />
          </button>
        </div>
      </nav>

      {/* Player & Content Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Cinema Video Stage */}
        <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden p-4 sm:p-6">
          <div className="surface-card rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative aspect-video w-full max-h-[72vh] flex items-center justify-center bg-black">
            <video
              key={course.videoUrl}
              src={course.videoUrl}
              poster={course.thumbnailUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            >
              Your browser does not support inline course playback.
            </video>
          </div>

          {/* Quick Meta under Player on desktop */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  {course.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10">
                  {course.difficulty}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
                  <Clock size={12} /> {course.duration}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{course.title}</h1>
            </div>

            {/* Interactive Player Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  liked
                    ? 'bg-red-600/20 border-red-500/40 text-red-400 shadow-lg shadow-red-950/40'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <ThumbsUp size={16} className={liked ? 'fill-red-400' : ''} />
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>

              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  bookmarked
                    ? 'bg-amber-600/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Bookmark size={16} className={bookmarked ? 'fill-amber-400' : ''} />
                <span>{bookmarked ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col h-auto lg:h-[calc(100vh-64px)] overflow-hidden">
          {/* Tabs Navigation */}
          <div className="p-3 border-b border-white/10 flex gap-2">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md border border-red-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers size={14} />
              <span>Curriculum</span>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md border border-red-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText size={14} />
              <span>Overview</span>
            </button>
          </div>

          {/* Tab 1: Curriculum Playlist */}
          {activeTab === 'curriculum' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="text-xs font-mono tracking-wider uppercase text-gray-500 px-1 mb-2">
                5 Lessons • 1h 41m Total
              </div>

              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    chapter.current
                      ? 'bg-red-500/10 border-red-500/40 text-white shadow-md'
                      : chapter.completed
                        ? 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/[0.05]'
                        : 'bg-white/[0.01] border-white/5 text-gray-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        chapter.current
                          ? 'bg-red-500 text-white'
                          : chapter.completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-gray-500'
                      }`}
                    >
                      {chapter.current ? (
                        <Play size={12} className="fill-white" />
                      ) : chapter.completed ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <span className="text-xs font-mono">{chapter.id}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium truncate">{chapter.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-gray-500 ml-2 flex-shrink-0">
                    {chapter.duration}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Overview & Resources */}
          {activeTab === 'details' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Instructor Card */}
              <div className="surface-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                  {course.instructor.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{course.instructor}</h4>
                  <p className="text-xs text-gray-400">Verified Mentor & Course Creator</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  About This Course
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">{course.description}</p>
              </div>

              {/* Resource Downloads */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Class Material
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => alert('Downloading starter repository archive...')}
                    className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-between text-xs text-gray-300 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Download size={14} className="text-red-400" />
                      Starter Code & Slides (.ZIP)
                    </span>
                    <span className="text-gray-500 font-mono">14.2 MB</span>
                  </button>
                  <button
                    onClick={() => alert('Downloading syllabus roadmap...')}
                    className="w-full p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] flex items-center justify-between text-xs text-gray-300 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Download size={14} className="text-red-400" />
                      Course Roadmap & Cheatsheet (.PDF)
                    </span>
                    <span className="text-gray-500 font-mono">2.1 MB</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
