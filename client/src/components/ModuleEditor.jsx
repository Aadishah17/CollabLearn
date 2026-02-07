import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Import styles
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Share2, ArrowLeft, Users } from 'lucide-react';
import { API_URL } from '../config';


const ModuleEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isCreating = !id || id === 'create';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(!isCreating);
    const [saving, setSaving] = useState(false);

    // Quill ref for potentially accessing editor instance for sockets later
    const quillRef = useRef(null);

    useEffect(() => {
        if (!isCreating) {
            fetchModule();
        }
    }, [id]);

    const fetchModule = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/modules/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const { title, content, description } = response.data.data;
            setTitle(title);
            setContent(content);
            setDescription(description);
            setLoading(false);
        } catch (error) {
            console.error("Error loading module:", error);
            // alert("Failed to load module");
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const payload = { title, content, description };
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            if (isCreating) {
                const response = await axios.post(`${API_URL}/api/modules`, payload, config);
                navigate(`/modules/${response.data.data._id}`);
            } else {
                await axios.put(`${API_URL}/api/modules/${id}`, payload, config);
            }
            setSaving(false);
        } catch (error) {
            console.error("Error saving module:", error);
            alert("Failed to save. Make sure you are logged in.");
            setSaving(false);
        }
    };

    // Custom Toolbar for Quill
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean']
        ],
    };

    if (loading) {
        return <div className="min-h-screen glass-page flex items-center justify-center text-white">Loading Editor...</div>;
    }

    return (
        <div className="min-h-screen glass-page flex flex-col text-slate-100">
            {/* Top Bar */}
            <div className="h-16 border-b border-white/12 liquid-glass px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/modules')} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-zinc-300 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Module"
                        className="bg-transparent text-lg font-bold text-white placeholder-zinc-500 focus:outline-none border-b border-transparent focus:border-red-500 px-2 py-1 w-64 sm:w-96 transition-all"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-4">
                        {/* Mock Active Users */}
                        <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-black/50 flex items-center justify-center text-xs font-bold" title="You">Me</div>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2 glass-panel text-zinc-200 rounded-lg text-sm font-medium transition-colors">
                        <Share2 size={16} />
                        Share
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg ${saving
                            ? 'bg-red-700/45 text-red-100 cursor-wait'
                            : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/40'
                            }`}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (Optional - Outline/Chat) */}

                {/* Main Editor */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-4xl mx-auto liquid-glass min-h-[calc(100vh-8rem)] rounded-xl shadow-2xl border border-white/15 flex flex-col">
                        {/* Inputs for meta overrides if needed */}

                        <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            className="flex-1 flex flex-col h-full text-slate-200"
                        />
                    </div>
                </div>
            </div>

            {/* Global Styles for Quill Dark Mode Override */}
            <style>{`
        .ql-toolbar {
          border-color: #1e293b !important;
          background-color: #0f172a;
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
        }
        .ql-container {
          border-color: #1e293b !important;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
        }
        .ql-editor {
          min-height: 300px;
        }
        .ql-stroke {
          stroke: #94a3b8 !important;
        }
        .ql-fill {
          fill: #94a3b8 !important;
        }
        .ql-picker {
          color: #94a3b8 !important;
        }
      `}</style>
        </div>
    );
};

export default ModuleEditor;
