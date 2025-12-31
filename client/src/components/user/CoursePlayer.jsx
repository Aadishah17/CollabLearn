import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ChevronLeft, Share2, Bookmark, Download, ThumbsUp } from 'lucide-react';

const CoursePlayer = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/courses/${id}`);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin text-indigo-500 w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!course) {
        return <div className="p-8 text-center">Course not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Navigation */}
            <nav className="border-b border-gray-800 bg-gray-900 px-4 h-16 flex items-center justify-between sticky top-0 z-50">
                <Link to="/courses" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                    <span>Back to Courses</span>
                </Link>
                <div className="font-semibold truncate max-w-md px-4">{course.title}</div>
                <div className="w-24"></div> {/* Spacer for center alignment */}
            </nav>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
                {/* Main Content (Player) */}
                <div className="flex-grow flex flex-col overflow-y-auto lg:overflow-hidden">
                    {/* Player Container */}
                    <div className="bg-black w-full aspect-video lg:h-[70vh] relative">
                        <ReactPlayer
                            url={course.videoUrl}
                            width="100%"
                            height="100%"
                            controls={true}
                            playing={true}
                            light={course.thumbnailUrl}
                        />
                    </div>

                    {/* Mobile Info (visible only on small screens) */}
                    <div className="p-6 lg:hidden">
                        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
                        <p className="text-gray-400 mb-4">{course.description}</p>
                    </div>
                </div>

                {/* Sidebar (Course Details) - Hidden on mobile, usually would be collapsible or below */}
                <div className="hidden lg:flex w-96 border-l border-gray-800 flex-col bg-gray-900 h-full overflow-y-auto">
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                                {course.instructor.charAt(0)}
                            </div>
                            <div>
                                <div className="font-medium text-white">{course.instructor}</div>
                                <div className="text-xs text-gray-400">Instructor</div>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold mb-3">{course.title}</h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            {course.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">{course.category}</span>
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">{course.difficulty}</span>
                            </div>
                            <span>{course.duration}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        <h3 className="font-bold text-gray-300 mb-4 text-sm uppercase tracking-wider">Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg transition-colors text-sm">
                                <ThumbsUp size={16} /> Like
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg transition-colors text-sm">
                                <Share2 size={16} /> Share
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg transition-colors text-sm">
                                <Bookmark size={16} /> Save
                            </button>
                            <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg transition-colors text-sm">
                                <Download size={16} /> Resources
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
