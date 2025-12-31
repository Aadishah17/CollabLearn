import React from 'react';
import { Link } from 'react-router-dom';
import MainNavbar from '../../navbar/mainNavbar';
import { CheckCircle, Zap, DollarSign, Users, ArrowRight } from 'lucide-react';

const Teach = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
            <MainNavbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-indigo-50 to-white dark:from-slate-900 dark:to-slate-800 transition-colors">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold mb-6">
                        Founding Partner Program
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                        Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Founding Instructor</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
                        We are curating a select group of 10 instructors to launch with us. License your existing content and earn higher revenue share.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full sm:w-auto">
                            Apply Now
                        </button>
                        <button className="px-8 py-4 bg-white dark:bg-slate-800 text-gray-700 dark:text-white border border-gray-200 dark:border-slate-600 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all w-full sm:w-auto">
                            Book a 10-min Chat
                        </button>
                    </div>
                </div>
            </section>

            {/* The Offer Grid */}
            <section className="py-20 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Why Join Us?</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">The benefits of being a Founding Partner</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-100/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6">
                                <DollarSign size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Premium Revenue Share</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Founders get <span className="font-bold text-gray-900 dark:text-white">X%</span> of the monthly creator pool. This is significantly higher than our standard rate for future instructors.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-100/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Homepage Exposure</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                You will be featured on our homepage for the first <span className="font-bold text-gray-900 dark:text-white">3 months</span> post-launch, guaranteeing maximum visibility.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-xl shadow-gray-100/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Minimal Effort</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                We don't want you to create new work. We want to <span className="font-bold text-gray-900 dark:text-white">license your existing best content</span>. We handle hosting and marketing.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recruitment Letter (Visualized) */}
            <section className="py-20 bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-gray-800 p-8 md:p-12 rounded-2xl border border-gray-700 relative overflow-hidden">
                        {/* Decorative quote mark */}
                        <div className="absolute top-0 right-0 p-8 opacity-10 font-serif text-9xl leading-none font-bold text-white">"</div>

                        <h2 className="text-2xl font-bold mb-6">A personal note to creators</h2>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                "I've been building this platform to solve a specific problem in [Niche]. Your teaching style is exactly what we are missing."
                            </p>
                            <p>
                                We are launching in 4 weeks. This is an invitation to be part of the core team that shapes the curriculum, without the heavy lifting of building a business from scratch.
                            </p>
                            <p>
                                Are you open to a 10-minute chat this week to discuss the royalty structure?
                            </p>
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-full"></div>
                            <div>
                                <div className="font-bold text-white">Your Name</div>
                                <div className="text-indigo-300">Founder, CollabLearn</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-gray-500 text-sm">
                © 2024 CollabLearn. All rights reserved.
            </footer>
        </div>
    );
};

export default Teach;
