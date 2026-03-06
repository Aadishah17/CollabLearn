import { useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Link2,
  Save,
  Shield,
  Sparkles,
} from 'lucide-react';
import { API_URL } from '../config';

const MODULE_TEMPLATES = {
  'study-guide': {
    title: 'Study Sprint Guide',
    description: 'A clean module for weekly learning goals, resources, and review notes.',
    visibility: 'private',
    tags: ['study-plan', 'resources', 'review'],
    content: `
      <h1>Study Sprint Guide</h1>
      <p>Use this module to keep one learning sprint focused and easy to follow.</p>
      <h2>Outcome</h2>
      <p>What should the learner be able to do by the end of this sprint?</p>
      <h2>Weekly checkpoints</h2>
      <ul>
        <li>Checkpoint 1</li>
        <li>Checkpoint 2</li>
        <li>Checkpoint 3</li>
      </ul>
      <h2>Resources</h2>
      <p>Add videos, articles, practice tasks, and mentoring notes here.</p>
      <h2>Reflection</h2>
      <p>Capture what worked, what felt difficult, and the next action.</p>
    `,
  },
  workshop: {
    title: 'Workshop Plan',
    description: 'A collaborative outline for a live class, cohort session, or office hour.',
    visibility: 'link',
    tags: ['workshop', 'agenda', 'teaching'],
    content: `
      <h1>Workshop Plan</h1>
      <p>Outline the session flow, exercises, and handoff notes for collaborators.</p>
      <h2>Session objective</h2>
      <p>What should participants understand or produce by the end?</p>
      <h2>Agenda</h2>
      <ol>
        <li>Opening context</li>
        <li>Demonstration</li>
        <li>Hands-on practice</li>
        <li>Questions and next steps</li>
      </ol>
      <h2>Materials</h2>
      <p>Add links, examples, and prep requirements here.</p>
      <h2>Follow-up</h2>
      <p>Document recording links, recap tasks, and discussion prompts.</p>
    `,
  },
  'team-notes': {
    title: 'Shared Team Notes',
    description: 'A shared workspace for collaborators learning or teaching together.',
    visibility: 'private',
    tags: ['team', 'notes', 'collaboration'],
    content: `
      <h1>Shared Team Notes</h1>
      <p>Keep live notes, decisions, and follow-ups in one place.</p>
      <h2>Current focus</h2>
      <p>What are you solving or learning right now?</p>
      <h2>Discussion notes</h2>
      <p>Add key points, examples, and blockers here.</p>
      <h2>Decisions</h2>
      <ul>
        <li>Decision 1</li>
        <li>Decision 2</li>
      </ul>
      <h2>Next actions</h2>
      <p>Capture who owns what and what should happen next.</p>
    `,
  },
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'code-block'],
    ['clean'],
  ],
};

function getPlainText(content) {
  return String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getOutline(content) {
  const headings = [];
  const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi;
  let match = regex.exec(String(content || ''));

  while (match) {
    headings.push({
      level: Number(match[1]),
      label: String(match[2]).replace(/<[^>]*>/g, '').trim(),
    });
    match = regex.exec(String(content || ''));
  }

  return headings.slice(0, 8);
}

export default function ModuleEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  const isCreating = !id || id === 'create';
  const templateKey = new URLSearchParams(location.search).get('template') || '';
  const template = MODULE_TEMPLATES[templateKey];
  const draftKey = 'collablearn-module-draft';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [tagsText, setTagsText] = useState('');
  const [loading, setLoading] = useState(!isCreating);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState('');

  useEffect(() => {
    const initializeEditor = async () => {
      if (isCreating) {
        const draft = localStorage.getItem(draftKey);

        if (draft) {
          try {
            const parsedDraft = JSON.parse(draft);
            setTitle(parsedDraft.title || '');
            setContent(parsedDraft.content || '');
            setDescription(parsedDraft.description || '');
            setVisibility(parsedDraft.visibility || 'private');
            setTagsText(parsedDraft.tagsText || '');
            setLoading(false);
            return;
          } catch (draftError) {
            console.error('Failed to parse module draft:', draftError);
          }
        }

        if (template) {
          setTitle(template.title);
          setContent(template.content);
          setDescription(template.description);
          setVisibility(template.visibility);
          setTagsText(template.tags.join(', '));
        }

        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/modules/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const moduleData = response.data?.data;
        if (!moduleData) {
          throw new Error('Module data missing');
        }

        setTitle(moduleData.title || '');
        setContent(moduleData.content || '');
        setDescription(moduleData.description || '');
        setVisibility(moduleData.visibility || 'private');
        setTagsText(Array.isArray(moduleData.tags) ? moduleData.tags.join(', ') : '');
      } catch (loadError) {
        console.error('Error loading module:', loadError);
        toast.error('Failed to load this module.');
      } finally {
        setLoading(false);
      }
    };

    initializeEditor();
  }, [draftKey, id, isCreating, template]);

  useEffect(() => {
    if (!isCreating || loading) {
      return;
    }

    localStorage.setItem(
      draftKey,
      JSON.stringify({ title, content, description, visibility, tagsText }),
    );
  }, [content, description, draftKey, isCreating, loading, tagsText, title, visibility]);

  const stats = useMemo(() => {
    const plainText = getPlainText(content);
    const wordCount = plainText ? plainText.split(/\s+/).length : 0;
    const readingMinutes = Math.max(1, Math.round(wordCount / 180));
    const outline = getOutline(content);

    return { wordCount, readingMinutes, outline };
  }, [content]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Add a module title before saving.');
      return;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      content,
      description: description.trim(),
      visibility,
      tags: tagsText
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isCreating) {
        const response = await axios.post(`${API_URL}/api/modules`, payload, config);
        localStorage.removeItem(draftKey);
        toast.success('Module created.');
        navigate(`/modules/${response.data?.data?._id}`);
        return;
      }

      await axios.put(`${API_URL}/api/modules/${id}`, payload, config);
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Module saved.');
    } catch (saveError) {
      console.error('Error saving module:', saveError);
      toast.error('Failed to save the module.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (isCreating) {
      toast('Save the module first to get a shareable link.');
      return;
    }

    try {
      await navigator.clipboard.writeText(`${window.location.origin}/modules/${id}`);
      toast.success('Module link copied.');
    } catch (copyError) {
      console.error('Copy link failed:', copyError);
      toast.error('Unable to copy the module link.');
    }
  };

  if (loading) {
    return (
      <div className="glass-page flex min-h-screen items-center justify-center px-6 text-white">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
          <h1 className="text-2xl font-bold">Opening editor</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Loading your module structure and writing workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/modules')}
              className="glass-icon-btn shrink-0"
              aria-label="Back to modules"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                {isCreating ? 'Create module' : 'Edit module'}
              </p>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Untitled module"
                className="mt-1 w-full min-w-[220px] bg-transparent text-2xl font-black tracking-tight text-white placeholder:text-zinc-500 focus:outline-none sm:min-w-[380px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewMode((currentMode) => !currentMode)}
              className="glass-chip border-white/15 bg-white/5 px-4 py-2"
            >
              {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
              {previewMode ? 'Edit mode' : 'Preview'}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="glass-chip border-white/15 bg-white/5 px-4 py-2"
            >
              <Link2 size={14} />
              Copy link
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="glass-cta">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save module'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-6 px-4 pb-10 pt-6 lg:grid-cols-[1fr_320px] lg:px-6">
        <section className="space-y-5">
          <div className="surface-card p-5">
            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-300">
                  Module summary
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="glass-input min-h-[110px]"
                  placeholder="Add a quick description so collaborators know what this module is for."
                />
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                    className="glass-input appearance-none"
                  >
                    <option value="private">Private</option>
                    <option value="link">Shared by link</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-300">Tags</label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(event) => setTagsText(event.target.value)}
                    className="glass-input"
                    placeholder="react, curriculum, workshop"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card overflow-hidden">
            {previewMode ? (
              <div className="min-h-[70vh] px-6 py-8 md:px-10">
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: content || '<p>Nothing to preview yet.</p>' }} />
                </div>
              </div>
            ) : (
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                className="module-quill min-h-[70vh] text-zinc-100"
              />
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="surface-card p-5">
            <div className="eyebrow">
              <Sparkles size={14} className="text-red-300" />
              Editor insights
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Word count
                </p>
                <p className="mt-2 text-2xl font-black text-white">{stats.wordCount}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Estimated read
                </p>
                <p className="mt-2 text-2xl font-black text-white">{stats.readingMinutes} min</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Save state
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">
                  {lastSavedAt ? `Last saved at ${lastSavedAt}` : 'Unsaved changes or new draft'}
                </p>
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Outline
            </p>
            <div className="mt-4 space-y-3">
              {stats.outline.length === 0 ? (
                <p className="text-sm leading-6 text-zinc-400">
                  Add headings in the editor to generate a quick outline.
                </p>
              ) : (
                stats.outline.map((heading, index) => (
                  <div
                    key={`${heading.label}-${index}`}
                    className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3"
                    style={{ marginLeft: `${(heading.level - 1) * 10}px` }}
                  >
                    <p className="text-sm font-semibold text-zinc-100">{heading.label}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      H{heading.level}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-200">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Publishing guidance</p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">
                  Keep private modules for working notes, use shared-link modules for team review,
                  and switch to public when the resource is ready for discovery.
                </p>
              </div>
            </div>

            {template ? (
              <div className="mt-5 rounded-[22px] border border-blue-400/20 bg-blue-500/10 p-4 text-sm leading-7 text-blue-100">
                Started from the <span className="font-semibold">{template.title}</span> template.
              </div>
            ) : null}
          </div>
        </aside>
      </main>

      <style>{`
        .module-quill .ql-toolbar {
          border: 0 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          background: rgba(9, 9, 11, 0.82);
          padding: 14px 18px;
        }

        .module-quill .ql-container {
          border: 0 !important;
          font-family: "Space Grotesk", system-ui, sans-serif;
          font-size: 1rem;
          min-height: 64vh;
        }

        .module-quill .ql-editor {
          min-height: 64vh;
          padding: 28px 34px 40px;
          color: rgb(244 244 245);
          line-height: 1.8;
        }

        .module-quill .ql-editor.ql-blank::before {
          color: rgba(161, 161, 170, 0.75);
          font-style: normal;
        }

        .module-quill .ql-stroke {
          stroke: #a1a1aa !important;
        }

        .module-quill .ql-fill {
          fill: #a1a1aa !important;
        }

        .module-quill .ql-picker {
          color: #d4d4d8 !important;
        }
      `}</style>
    </div>
  );
}
