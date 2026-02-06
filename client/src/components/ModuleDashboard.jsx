import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlusCircle, Book, Users, Globe, Lock } from 'lucide-react';
import { API_URL } from '../config';

// import { AuthContext } from '../auth/AuthContext'; // Removed

const ModuleDashboard = () => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    // const { user } = useContext(AuthContext); 
    const user = {
        _id: localStorage.getItem('userId'),
        name: localStorage.getItem('username')
    };

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const response = await axios.get(`${API_URL}/api/modules`, config);
            setModules(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching modules:", error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Study Modules
                        </h1>
                        <p className="text-slate-400 mt-2">Create, share, and collaborate on learning resources.</p>
                    </div>
                    <Link
                        to="/modules/create"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-all"
                    >
                        <PlusCircle size={20} />
                        Create Module
                    </Link>
                </div>

                {/* Filters (Mock) */}
                <div className="flex gap-4 mb-8">
                    <button className="px-4 py-1.5 bg-slate-800 border border-blue-500 text-blue-400 rounded-full text-sm font-medium">
                        All Modules
                    </button>
                    <button className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500 rounded-full text-sm transition-all">
                        My Modules
                    </button>
                    <button className="px-4 py-1.5 bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500 rounded-full text-sm transition-all">
                        Shared with Me
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading modules...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map((module) => (
                            <div key={module._id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${module.visibility === 'public' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                        {module.visibility === 'public' ? <Globe size={20} /> : <Lock size={20} />}
                                    </div>
                                    {module.owner?._id === user?._id && (
                                        <span className="text-xs font-semibold bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                            OWNER
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-blue-400 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                                    {module.description || "No description provided."}
                                </p>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                                    <div className="flex -space-x-2">
                                        {/* Mock avatars for collaborators */}
                                        <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs">
                                            {module.owner?.name?.[0] || "U"}
                                        </div>
                                        {module.collaborators?.length > 1 && (
                                            <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs">
                                                +{module.collaborators.length - 1}
                                            </div>
                                        )}
                                    </div>

                                    <Link
                                        to={`/modules/${module._id}`}
                                        className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    >
                                        Open
                                        <Book size={16} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && modules.length === 0 && (
                    <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                        <Book size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-300">No modules found</h3>
                        <p className="text-slate-500 mt-2">Get started by creating your first study module.</p>
                        <Link
                            to="/modules/create"
                            className="inline-block mt-6 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-all"
                        >
                            Create Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleDashboard;
