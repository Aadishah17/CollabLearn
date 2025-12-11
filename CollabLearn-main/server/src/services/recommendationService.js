const User = require('../models/User');
const Skill = require('../models/Skill');
const Booking = require('../models/Booking');
const Post = require('../models/Post');

// Debug logger
const debugLog = (message, data = '') => {
    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_RECOMMENDATION) {
        console.log(`[RecommendationService] ${message}`, data);
    }
};

/**
 * Service for generating personalized skill recommendations
 */
const recommendationService = {
    /**
     * Get personalized recommendations for a user
     * @param {string} userId - The user ID
     * @param {number} limit - Max number of recommendations
     * @returns {Promise<Object>} Recommendation results
     */
    async getPersonalizedRecommendations(userId, limit = 20) {
        debugLog(`Starting recommendation for user: ${userId}`);

        // 1. Get user's profile and skills
        const [currentUser, userSkills, userBookings, userPosts] = await Promise.all([
            User.findById(userId),
            Skill.find({ user: userId }),
            Booking.find({ student: userId }).populate('instructor').populate('skill'),
            Post.find({ userId: userId })
        ]);

        if (!currentUser) {
            throw new Error('User not found');
        }

        // 2. Analyze user behavior and preferences
        const userProfile = await analyzeUserProfile(userId, userSkills, userBookings, userPosts);

        // 3. Get all available skills (EXCLUDING user's own skills)
        const availableSkills = await Skill.find({
            user: { $ne: userId },
            isOffering: true,
            isPosted: true
        }).populate('user', 'name avatar rating totalSessions badges createdAt');

        // Double-check filter
        const safeFilteredSkills = availableSkills.filter(skill =>
            skill.user && skill.user._id.toString() !== userId.toString()
        );

        // 4. Calculate recommendation scores
        const scoredRecommendations = await Promise.all(
            safeFilteredSkills.map(async (skill) => {
                const score = await calculateAdvancedRecommendationScore(skill, userProfile);
                return {
                    ...skill.toObject(),
                    recommendationScore: score.total,
                    scoreBreakdown: score.breakdown,
                    recommendationReason: score.primaryReason
                };
            })
        );

        // 5. Apply filtering and ranking
        let qualifyingRecommendations = scoredRecommendations
            .filter(skill => skill.recommendationScore > 15)
            .sort((a, b) => b.recommendationScore - a.recommendationScore);

        // 6. Diversification
        qualifyingRecommendations = diversifyRecommendations(qualifyingRecommendations);

        // 7. Temporal and trending factors
        qualifyingRecommendations = await applyTemporalFactors(qualifyingRecommendations);

        // 8. Final limiting
        let finalRecommendations = qualifyingRecommendations.slice(0, parseInt(limit));

        // Final safety check
        finalRecommendations = finalRecommendations.filter(rec =>
            rec.user && rec.user._id.toString() !== userId.toString()
        );

        return {
            data: finalRecommendations,
            userProfile: {
                preferredCategories: userProfile.preferredCategories,
                skillLevel: userProfile.skillLevel,
                learningGoals: userProfile.learningGoals
            },
            metadata: {
                totalAnalyzed: scoredRecommendations.length,
                qualifying: finalRecommendations.length,
                timestamp: new Date()
            }
        };
    }
};

// ============= PRIVATE HELPER FUNCTIONS =============

const analyzeUserProfile = async (userId, userSkills, userBookings, userPosts) => {
    const profile = {
        preferredCategories: {},
        skillLevel: 'Beginner',
        learningGoals: [],
        interactionHistory: {},
        socialEngagement: 0,
        learningIntensity: 0,
        preferredInstructorTypes: {},
        timePreferences: {},
        pricePreferences: { min: 0, max: 100, prefersFree: false }
    };

    const seekingSkills = userSkills.filter(s => s.isSeeking);
    const offeringSkills = userSkills.filter(s => s.isOffering);

    [...seekingSkills, ...offeringSkills].forEach(skill => {
        profile.preferredCategories[skill.category] =
            (profile.preferredCategories[skill.category] || 0) + 1;
    });

    profile.learningGoals = seekingSkills.map(s => s.name.toLowerCase());

    if (offeringSkills.length > 0) {
        const levels = offeringSkills.map(s => s.offering?.level).filter(Boolean);
        const levelCounts = levels.reduce((acc, level) => {
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        profile.skillLevel = Object.keys(levelCounts).reduce((a, b) =>
            levelCounts[a] > levelCounts[b] ? a : b, 'Beginner');
    }

    if (userBookings.length > 0) {
        profile.learningIntensity = userBookings.length / Math.max(1,
            (Date.now() - new Date(userBookings[0].createdAt)) / (1000 * 60 * 60 * 24 * 30));

        userBookings.forEach(booking => {
            if (booking.instructor) {
                const instructorId = booking.instructor._id.toString();
                profile.preferredInstructorTypes[instructorId] =
                    (profile.preferredInstructorTypes[instructorId] || 0) + 1;
            }
        });

        const prices = userBookings.map(b => b.skill?.offering?.price || 0).filter(p => p > 0);
        if (prices.length > 0) {
            profile.pricePreferences.min = Math.min(...prices);
            profile.pricePreferences.max = Math.max(...prices);
        }
        profile.pricePreferences.prefersFree = userBookings.some(b =>
            (b.skill?.offering?.price || 0) === 0);
    }

    if (userPosts.length > 0) {
        profile.socialEngagement = userPosts.reduce((sum, post) =>
            sum + (post.stats?.likes || 0) + (post.stats?.comments || 0), 0) / userPosts.length;
    }

    return profile;
};

const calculateAdvancedRecommendationScore = async (skill, userProfile) => {
    const breakdown = {
        directMatch: 0,
        categoryAffinity: 0,
        levelCompatibility: 0,
        instructorQuality: 0,
        socialProof: 0,
        temporalRelevance: 0,
        priceCompatibility: 0,
        diversityBonus: 0
    };

    const weights = {
        directMatch: 30,
        categoryAffinity: 20,
        levelCompatibility: 15,
        instructorQuality: 12,
        socialProof: 8,
        temporalRelevance: 6,
        priceCompatibility: 5,
        diversityBonus: 4
    };

    const skillNameLower = skill.name.toLowerCase();

    // 1. Direct Match
    if (userProfile.learningGoals.includes(skillNameLower)) {
        breakdown.directMatch = weights.directMatch;
    }

    // Complementary Skills
    const complementarySkills = await getComplementarySkills(userProfile.learningGoals);
    if (complementarySkills.some(comp => skillNameLower.includes(comp))) {
        breakdown.directMatch += weights.directMatch * 0.6;
    }

    // 2. Category Affinity
    const categoryPreference = userProfile.preferredCategories[skill.category] || 0;
    const totalUserSkills = Object.values(userProfile.preferredCategories).reduce((a, b) => a + b, 0);
    if (totalUserSkills > 0) {
        breakdown.categoryAffinity = (categoryPreference / totalUserSkills) * weights.categoryAffinity;
    }

    // 3. Level Compatibility
    if (skill.offering?.level) {
        const levelHierarchy = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3, 'Expert': 4 };
        const skillLevel = levelHierarchy[skill.offering.level] || 2;
        const userLevel = levelHierarchy[userProfile.skillLevel] || 1;
        const optimalLevel = Math.min(4, userLevel + 1);
        const levelDiff = Math.abs(skillLevel - optimalLevel);
        breakdown.levelCompatibility = Math.max(0, weights.levelCompatibility - (levelDiff * 3));
    }

    // 4. Instructor Quality
    const instructor = skill.user;
    if (instructor) {
        let qualityScore = 0;
        if (instructor.rating?.average) qualityScore += (instructor.rating.average / 5) * 5;
        if (instructor.totalSessions) qualityScore += Math.min(4, Math.log10(instructor.totalSessions + 1));
        if (instructor.badges?.length) qualityScore += Math.min(3, instructor.badges.length);
        breakdown.instructorQuality = Math.min(weights.instructorQuality, qualityScore);
    }

    // 5. Social Proof
    if (skill.offering) {
        let socialScore = 0;
        socialScore += Math.min(3, Math.log10((skill.offering.sessions || 0) + 1));
        if (skill.offering.rating) socialScore += (skill.offering.rating / 5) * 3;
        breakdown.socialProof = Math.min(weights.socialProof, socialScore);
    }

    // 6. Temporal Relevance
    const skillAge = (Date.now() - new Date(skill.updatedAt)) / (1000 * 60 * 60 * 24);
    if (skillAge < 7) breakdown.temporalRelevance = weights.temporalRelevance;
    else if (skillAge < 30) breakdown.temporalRelevance = weights.temporalRelevance * 0.7;
    else if (skillAge < 90) breakdown.temporalRelevance = weights.temporalRelevance * 0.4;

    // 7. Price Compatibility
    const skillPrice = skill.offering?.price || 0;
    if (skillPrice === 0 && userProfile.pricePreferences.prefersFree) {
        breakdown.priceCompatibility = weights.priceCompatibility;
    } else if (skillPrice >= userProfile.pricePreferences.min && skillPrice <= userProfile.pricePreferences.max) {
        breakdown.priceCompatibility = weights.priceCompatibility * 0.8;
    }

    // 8. Diversity Bonus
    const categoryCount = userProfile.preferredCategories[skill.category] || 0;
    const totalCategories = Object.keys(userProfile.preferredCategories).length;
    if (totalCategories > 3 && categoryCount === 0) {
        breakdown.diversityBonus = weights.diversityBonus;
    }

    const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const maxScore = Math.max(...Object.values(breakdown));
    const primaryReason = Object.keys(breakdown).find(key => breakdown[key] === maxScore);

    return {
        total: Math.min(100, Math.round(total)),
        breakdown,
        primaryReason
    };
};

const getComplementarySkills = async (learningGoals) => {
    const complementaryMap = {
        'javascript': ['react', 'node.js', 'typescript', 'html', 'css'],
        'react': ['javascript', 'redux', 'next.js', 'typescript'],
        'python': ['django', 'flask', 'data science', 'machine learning', 'pandas'],
        'java': ['spring', 'hibernate', 'android', 'kotlin', 'maven'],
        'machine learning': ['python', 'tensorflow', 'pytorch', 'data science'],
        'web development': ['html', 'css', 'javascript', 'react', 'node.js'],
        'data science': ['python', 'r', 'sql', 'machine learning', 'statistics'],
        'mobile development': ['react native', 'flutter', 'android', 'ios', 'kotlin'],
        'devops': ['docker', 'kubernetes', 'aws', 'jenkins', 'terraform'],
        'ui/ux': ['figma', 'adobe xd', 'photoshop', 'user research', 'prototyping']
    };

    const complements = new Set();
    learningGoals.forEach(goal => {
        const related = complementaryMap[goal] || [];
        related.forEach(skill => complements.add(skill));
    });

    return Array.from(complements);
};

const diversifyRecommendations = (recommendations) => {
    const diversified = [];
    const categoryCount = {};
    const maxPerCategory = 3;
    const sorted = [...recommendations].sort((a, b) => b.recommendationScore - a.recommendationScore);

    for (const recommendation of sorted) {
        const category = recommendation.category;
        const currentCount = categoryCount[category] || 0;

        if (currentCount < maxPerCategory) {
            diversified.push(recommendation);
            categoryCount[category] = currentCount + 1;
        }
    }

    const remaining = sorted.filter(item => !diversified.includes(item));
    const finalCount = Math.min(20, diversified.length + remaining.length);
    return [...diversified, ...remaining].slice(0, finalCount);
};

const applyTemporalFactors = async (recommendations) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trendingSkills = await Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$skill', bookingCount: { $sum: 1 } } },
        { $sort: { bookingCount: -1 } },
        { $limit: 10 }
    ]);

    const trendingSkillIds = trendingSkills.map(t => t._id.toString());

    return recommendations.map(rec => {
        let trendingBonus = 0;
        if (trendingSkillIds.includes(rec._id.toString())) {
            trendingBonus = 5;
        }
        return {
            ...rec,
            recommendationScore: rec.recommendationScore + trendingBonus,
            isTrending: trendingBonus > 0
        };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
};

module.exports = recommendationService;
