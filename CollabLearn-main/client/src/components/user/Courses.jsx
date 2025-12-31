import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Clock, BarChart } from 'lucide-react';
import MainNavbar from '../../navbar/mainNavbar';

const CourseCard = ({ course }) => (
    <Link to={`/courses/${course._id}/learn`} className="group">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-700 flex flex-col h-full">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play size={24} className="text-indigo-600 ml-1" />
                    </div>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md">
                    {course.duration}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                        {course.category}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <BarChart size={12} />
                        {course.difficulty}
                    </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {course.title}
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
                    {course.description}
                </p>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {course.instructor.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{course.instructor}</span>
                </div>
            </div>
        </div>
    </Link>
);

const Courses = () => {
    const location = useLocation();

    // Expanded categories to match Landing Page + Starter Kit
    const categories = [
        'All',
        'Programming',
        'Academics',
        'Music',
        'Arts & Design',
        'Visual Design',
        'Content Creation',
        'Productivity'
    ];

    // Detailed descriptions for each category
    const categoryDescriptions = {
        'All': 'Master new skills with our curated curriculum.',
        'Programming': 'Unlock the power of code. Full-stack development, Python, AI, and more.',
        'Academics': 'Excel in your studies with expert tutoring in Math, Science, and Languages.',
        'Music': 'Learn an instrument, master music theory, or produce your own tracks.',
        'Arts & Design': 'Unleash your creativity. Graphic design, painting, illustration, and UI/UX.',
        'Visual Design': 'Master color theory, typography, and layout design.',
        'Content Creation': 'Build your audience with video editing, storytelling, and social media.',
        'Productivity': 'Optimize your workflow, manage time effectively, and achieve more.'
    };

    // Initialize state from URL param if present
    const [selectedCategory, setSelectedCategory] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('category') || 'All';
    });

    // Update state if URL changes (e.g. navigation)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam && categories.includes(categoryParam)) {
            setSelectedCategory(categoryParam);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                let url = 'http://localhost:5000/api/courses';
                if (selectedCategory !== 'All') {
                    url += `?category=${encodeURIComponent(selectedCategory)}`;
                }

                const response = await fetch(url);
                const data = await response.json();

                if (data.success) {
                    setCourses(data.courses);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [selectedCategory]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <MainNavbar />

            <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedCategory === 'All' ? 'Explore Courses' : `${selectedCategory} Courses`}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        {categoryDescriptions[selectedCategory] || 'Master new skills with our curated curriculum.'}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Course Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl h-80 animate-pulse shadow-sm border border-gray-100 dark:border-slate-700">
                                <div className="h-40 bg-gray-200 dark:bg-slate-700 w-full"></div>
                                <div className="p-4">
                                    <div className="h-4 bg-gray-200 w-1/3 mb-2 rounded"></div>
                                    <div className="h-6 bg-gray-200 w-3/4 mb-4 rounded"></div>
                                    <div className="h-4 bg-gray-200 w-full rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {courses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {courses.map(course => (
                                    <CourseCard key={course._id} course={course} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-gray-500 dark:text-gray-400 text-lg">No courses found in this category.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default Courses;
