import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Clock, Star, ArrowLeft, Zap, Award, TrendingUp } from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';
import { formatINR } from '../../utils/currencyUtils';
import { API_URL } from '../../config';


// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="bg-black border border-white rounded-2xl shadow-lg overflow-hidden">
    <div className="p-5 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/3"></div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-800"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-5 bg-gray-800 rounded w-5/6 mb-3"></div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-800 rounded"></div>
        <div className="h-3 bg-gray-800 rounded w-5/6"></div>
      </div>
      <div className="flex items-center gap-3 text-xs mt-4">
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
        <div className="h-4 bg-gray-800 rounded w-1/4"></div>
      </div>
      <div className="h-11 bg-gray-800 rounded-lg mt-5"></div>
    </div>
  </div>
);

const SkillRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to see recommendations.');
          setLoading(false);
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Use the new personalized recommendations endpoint
        const response = await fetch(`${API_URL}/api/skills/recommendations`, {
          headers,
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          // Store user profile info for UI enhancements
          localStorage.setItem('userSkillsProfile', JSON.stringify(data.userProfile || {}));

          // Set recommendations with enhanced data
          setRecommendations(data.data || []);

        } else {
          throw new Error(data.message || 'Failed to get recommendations');
        }

      } catch (err) {
        console.error('Recommendation fetch error:', err);
        setError(err.message || 'Failed to load recommendations');

        // Fallback to basic search if advanced recommendations fail
        try {
          const token = localStorage.getItem('token');
          const fallbackResponse = await fetch(`${API_URL}/api/skills/search?offering=true`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const basicRecommendations = (fallbackData.data || []).map(skill => ({
              ...skill,
              recommendationScore: Math.floor(Math.random() * 50) + 30, // Basic random scoring
              recommendationReason: 'Basic match'
            }));
            setRecommendations(basicRecommendations.slice(0, 12));
            setError(null); // Clear error if fallback works
          }
        } catch (fallbackErr) {
          console.error('Fallback failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleBackToBrowse = () => {
    window.history.back();
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Java': 'bg-orange-900/30 text-orange-200',
      'C/C++': 'bg-blue-900/30 text-blue-200',
      'Python': 'bg-green-900/30 text-green-200',
      'MERN': 'bg-purple-900/30 text-purple-200',
      'Programming': 'bg-blue-900/30 text-blue-200',
      'Design': 'bg-pink-900/30 text-pink-200',
      'Data Science': 'bg-green-900/30 text-green-200',
      'Marketing': 'bg-yellow-900/30 text-yellow-200',
      'Language': 'bg-red-900/30 text-red-200',
      'Music': 'bg-teal-900/30 text-teal-200',
      'Art': 'bg-purple-900/30 text-purple-200',
      'Business': 'bg-indigo-900/30 text-indigo-200',
      'Writing': 'bg-gray-800 text-gray-200',
      'Photography': 'bg-cyan-900/30 text-cyan-200',
      'Fitness': 'bg-lime-900/30 text-lime-200',
      'Cooking': 'bg-orange-900/30 text-orange-200',
      'Other': 'bg-gray-800 text-gray-200'
    };
    return colors[category] || 'bg-gray-800 text-gray-200';
  };

  const getMatchScoreDetails = (score) => {
    if (score >= 90) return { text: 'Perfect Match', color: 'from-emerald-500 to-green-600', icon: '🎯' };
    if (score >= 80) return { text: 'Excellent Match', color: 'from-blue-500 to-indigo-600', icon: '⭐' };
    if (score >= 70) return { text: 'Great Match', color: 'from-purple-500 to-violet-600', icon: '✨' };
    if (score >= 60) return { text: 'Good Match', color: 'from-orange-500 to-amber-600', icon: '👍' };
    if (score >= 50) return { text: 'Fair Match', color: 'from-yellow-500 to-orange-500', icon: '📚' };
    return { text: 'Basic Match', color: 'from-gray-500 to-slate-600', icon: '🔍' };
  };

  const getRecommendationBadge = (skill) => {
    // Use backend recommendation reason if available
    if (skill.recommendationReason) {
      const reasonMap = {
        'directMatch': { text: 'Perfect for you', type: 'direct' },
        'categoryAffinity': { text: 'Matches your interests', type: 'high' },
        'instructorQuality': { text: 'Top rated instructor', type: 'rated' },
        'socialProof': { text: 'Popular choice', type: 'experienced' },
        'priceCompatibility': { text: 'Great value', type: 'free' },
        'diversityBonus': { text: 'Explore new skills', type: 'explore' }
      };
      return reasonMap[skill.recommendationReason] || { text: 'Recommended', type: 'high' };
    }

    // Fallback logic
    if (skill.offering?.price === 0) return { text: 'Free to learn', type: 'free' };
    if (skill.offering?.rating >= 4.5) return { text: 'Top rated', type: 'rated' };
    if (skill.offering?.sessions >= 10) return { text: 'Experienced tutor', type: 'experienced' };
    return { text: 'Worth exploring', type: 'explore' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <MainNavbar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <MainNavbar />
        <div className="text-center py-10 text-red-500">Error: {error.message || "An unknown error occurred"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <MainNavbar />
      <main className="pt-24 max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToBrowse}
                className="w-9 h-9 bg-gray-900 hover:bg-gray-800 rounded-full flex items-center justify-center transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              {/* Discover Skills Icon with Deeper Lavender-Purple Gradient */}
              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Discover Skills</h1>
                <p className="text-gray-400 text-xs">Personalized recommendations based on your profile</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Grid View */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendations.map(skill => {
                const matchScore = skill.recommendationScore || skill.matchScore || 0;
                const matchDetails = getMatchScoreDetails(matchScore);
                const recommendation = getRecommendationBadge(skill);

                return (
                  <div key={skill._id} className="bg-black border border-white rounded-2xl shadow-lg overflow-hidden 
                  transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl flex flex-col group">

                    <div className="p-5 flex flex-col flex-grow">

                      {/* Category and Match Score */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryColor(skill.category)}`}>
                          {skill.category}
                        </span>
                        <div className={`flex items-center gap-1 text-xs font-semibold bg-gradient-to-r ${matchDetails.color} text-white px-2 py-0.5 rounded-full shadow-sm`}>
                          <span>{matchDetails.icon}</span>
                          <span>{matchScore}%</span>
                          {skill.isTrending && <TrendingUp className="w-3 h-3 ml-1" />}
                        </div>
                      </div>

                      {/* Recommendation Badge */}
                      <div className="mb-3">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full
                        ${recommendation.type === 'direct' ? 'bg-emerald-900/30 text-emerald-200' :
                            recommendation.type === 'high' ? 'bg-blue-900/30 text-blue-200' :
                              recommendation.type === 'free' ? 'bg-green-900/30 text-green-200' :
                                recommendation.type === 'rated' ? 'bg-amber-900/30 text-amber-200' :
                                  recommendation.type === 'experienced' ? 'bg-purple-900/30 text-purple-200' :
                                    'bg-gray-800 text-gray-200'}`}>
                          {recommendation.text}
                        </span>
                      </div>

                      {/* Instructor Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-red-600 flex items-center justify-center text-xl shadow font-semibold text-white group-hover:scale-110 transition-transform">
                          {skill.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-white">{skill.user?.name || 'Anonymous'}</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{skill.offering?.rating?.toFixed(1) || skill.user?.rating?.average?.toFixed(1) || 'N/A'}</span>
                            <span>•</span>
                            <span>{skill.offering?.sessions || skill.user?.totalSessions || 0} sessions</span>
                          </div>
                        </div>
                      </div>

                      {/* Skill Details */}
                      <div className="flex-grow">
                        <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-red-500 transition-colors">{skill.name}</h4>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed line-clamp-3">
                          {skill.offering?.description || 'Discover this skill with an experienced instructor.'}
                        </p>
                      </div>

                      {/* Skill Metadata */}
                      <div className="flex items-center gap-3 text-xs text-gray-300 mt-auto">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-red-500" />
                          <span>{skill.offering?.duration || 'Flexible'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-red-500" />
                          <span>{skill.offering?.level || 'All levels'}</span>
                        </div>
                      </div>

                      {/* Match Score Details */}
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-medium">{matchDetails.text}</span>
                        {matchScore >= 80 && (
                          <span className="ml-2 text-emerald-600">• Highly recommended</span>
                        )}
                        {skill.scoreBreakdown && (
                          <div className="mt-1 text-xs text-gray-400">
                            Based on: {Object.entries(skill.scoreBreakdown)
                              .filter(([_, score]) => score > 0)
                              .map(([key, _]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-5 pt-2">
                      <button className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg font-semibold text-sm 
                      hover:shadow-md hover:scale-[1.02] transition-all duration-300 group-hover:from-red-700 group-hover:to-red-900">
                        Book Session • {skill.offering?.price > 0 ? `${formatINR(skill.offering.price)}/hr` : 'Free'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No recommendations yet</h3>
                <p className="text-gray-400 text-sm">
                  Add skills you want to learn to your profile to get personalized recommendations!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SkillRecommendations;
