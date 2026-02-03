import React, { useState } from 'react';
import MainNavbar from '../../navbar/mainNavbar';
import { Sparkles, Map, CheckCircle2, ArrowRight, BookOpen, Clock, Target, Rocket } from 'lucide-react';

const AiLearningPage = () => {
    const [skill, setSkill] = useState('');
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState(null);
    const [resources, setResources] = useState([]);
    const [error, setError] = useState('');

    const generateRoadmap = async (e) => {
        e.preventDefault();
        if (!skill.trim()) return;

        setLoading(true);
        setError('');
        setRoadmap(null);

        try {
            const response = await fetch('/api/ai/roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill: skill })
            });
            const data = await response.json();

            if (data.success) {
                setRoadmap(data.roadmap.steps || data.roadmap); // Handle potential new structure
                setResources(data.roadmap.resources || []);
            } else {
                setError('Failed to generate roadmap. Please try again.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <MainNavbar />

            <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
                {/* Hero Section */}
                <div className="text-center mb-16 animate-fadeInUp">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-900 text-white border border-red-500 rounded-full text-sm font-semibold mb-6">
                        <Sparkles size={16} />
                        <span>AI-Powered Learning Architecture</span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-white mb-6 leading-tight">
                        Master Any Skill with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                            Intelligent Roadmaps
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Stop guessing what to learn next. Our AI analyzes your goal and builds a personalized, step-by-step curriculum just for you.
                    </p>

                    {/* Input Form */}
                    <form onSubmit={generateRoadmap} className="max-w-xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-black border border-white rounded-xl shadow-xl p-2">
                            <div className="pl-4 text-gray-400">
                                <Target size={24} />
                            </div>
                            <input
                                type="text"
                                value={skill}
                                onChange={(e) => setSkill(e.target.value)}
                                placeholder="I want to learn..."
                                className="flex-1 p-4 bg-transparent text-lg text-white placeholder-gray-500 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !skill.trim()}
                                className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-70 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2 border border-white"
                            >
                                {loading ? 'Generating...' : (
                                    <>
                                        <span>Build Roadmap</span>
                                        <Rocket size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-xl mx-auto mb-8 p-4 bg-red-900 border border-red-500 text-red-100 rounded-lg text-center animate-slideDown">
                        {error}
                    </div>
                )}

                {/* Roadmap Display */}
                {roadmap && (
                    <div className="max-w-4xl mx-auto animate-fadeInUp">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Map className="text-red-500" />
                                Your Learning Path: <span className="text-red-500">{skill}</span>
                            </h2>
                            <div className="flex gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                    <Clock size={16} />
                                    <span>~{roadmap.length * 2} Weeks</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <BookOpen size={16} />
                                    <span>{roadmap.length} Modules</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            {/* Vertical Connecting Line */}
                            <div className="absolute left-[28px] top-6 bottom-6 w-1 bg-gray-800 rounded-full"></div>

                            <div className="space-y-8">
                                {roadmap.map((step, index) => (
                                    <div key={index} className="relative flex gap-6 group">
                                        {/* Step Indicator */}
                                        <div className="relative z-10 flex-shrink-0 w-14 h-14 bg-black border-4 border-white rounded-full flex items-center justify-center font-bold text-red-500 text-lg shadow-sm group-hover:border-red-500 group-hover:scale-110 transition-all duration-300">
                                            {index + 1}
                                        </div>

                                        {/* Content Card */}
                                        <div className="flex-1 bg-black rounded-2xl p-6 shadow-sm border border-white hover:shadow-md hover:border-red-500 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                                <span className="bg-green-900 text-green-100 border border-green-500 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                                    <CheckCircle2 size={12} />
                                                    Module {index + 1}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 leading-relaxed mb-4">
                                                {step.description}
                                            </p>

                                            <button className="text-red-500 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
                                                Start this module <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resources Section */}
                        {resources.length > 0 && (
                            <div className="mt-16 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <BookOpen className="text-red-500" />
                                    <span>Recommended Study Materials</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {resources.map((res, idx) => (
                                        <a
                                            key={idx}
                                            href={res.url.startsWith('http') ? res.url : `https://www.google.com/search?q=${encodeURIComponent(res.url)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group bg-black p-6 rounded-xl border border-white hover:border-red-500 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${res.type === 'Video' ? 'bg-red-900 text-red-100 border border-red-500' :
                                                    res.type === 'Article' ? 'bg-blue-900 text-blue-100 border border-blue-500' :
                                                        'bg-green-900 text-green-100 border border-green-500'
                                                    }`}>
                                                    {res.type}
                                                </span>
                                                <ArrowRight size={16} className="text-gray-500 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                            <h3 className="font-bold text-white mb-2 group-hover:text-red-500 transition-colors">
                                                {res.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 truncate">
                                                {res.url}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-12 text-center">
                            <button onClick={() => setSkill('')} className="text-gray-400 hover:text-red-500 font-medium transition-colors">
                                Start a new path
                            </button>
                        </div>
                    </div>
                )
                }
            </main >

            <style jsx>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
                .animate-slideDown { animation: slideDown 0.4s ease-out forwards; }
            `}</style>
        </div >
    );
};

export default AiLearningPage;
