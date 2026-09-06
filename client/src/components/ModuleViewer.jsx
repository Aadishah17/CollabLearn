import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ExternalLink, FileText } from 'lucide-react';
import MainNavbar from '../navbar/mainNavbar.jsx';
import { API_URL } from '../config.js';
import {
  getModuleEditPath,
  getModuleFixtureFromSearchParams,
  resolveModuleViewerState,
} from '../utils/moduleViewer.js';

const getRequestHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function ModuleViewer() {
  const { id } = useParams();
  const location = useLocation();
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fixtureModule = useMemo(
    () => getModuleFixtureFromSearchParams(new URLSearchParams(location.search)),
    [location.search]
  );

  useEffect(() => {
    if (fixtureModule) {
      setModuleData(fixtureModule);
      setError('');
      setLoading(false);
      return undefined;
    }

    const fetchModule = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${API_URL}/api/modules/${id}`, {
          headers: getRequestHeaders(),
        });
        setModuleData(response.data?.data || null);
      } catch (fetchError) {
        console.error('Error loading module viewer:', fetchError);
        setError(fetchError?.response?.data?.message || 'Could not load this module right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
    return undefined;
  }, [fixtureModule, id]);

  const viewerState = useMemo(() => resolveModuleViewerState(moduleData), [moduleData]);

  if (loading) {
    return (
      <div className="glass-page flex min-h-screen items-center justify-center px-6 text-white">
        <div className="surface-card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-2 border-white/15 border-t-red-500" />
          <h1 className="text-2xl font-bold">Opening module</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Loading the lesson viewer and module metadata.
          </p>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="glass-page min-h-screen text-zinc-100">
        <MainNavbar />
        <main className="mx-auto max-w-5xl px-4 pb-12 pt-28 sm:px-6">
          <section className="surface-card p-8 text-center">
            <FileText size={42} className="mx-auto text-zinc-500" />
            <h1 className="mt-5 text-3xl font-black text-white">Module unavailable</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {error || 'The module could not be found.'}
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="glass-page min-h-screen text-zinc-100">
      <MainNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6">
        <section className="surface-card p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="eyebrow">
                <BookOpen size={14} className="text-red-300" />
                {viewerState.mode === 'iframe' ? 'PreTeXt lesson' : 'Module lesson'}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
                {moduleData.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300 md:text-base">
                {moduleData.description || 'No description yet.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to="/modules" className="glass-chip border-white/15 bg-white/5 px-4 py-2">
                <ArrowLeft size={14} />
                Back to modules
              </Link>
              {!moduleData.fixture ? (
                <Link
                  to={getModuleEditPath(moduleData._id)}
                  className="glass-chip border-white/15 bg-white/5 px-4 py-2"
                >
                  Edit module
                </Link>
              ) : null}
              {viewerState.mode === 'iframe' && viewerState.src ? (
                <a
                  href={viewerState.src}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-chip border-white/15 bg-white/5 px-4 py-2"
                >
                  <ExternalLink size={14} />
                  Open source
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="surface-card mt-6 overflow-hidden p-0">
          {viewerState.mode === 'iframe' ? (
            <iframe
              title={moduleData.title}
              src={viewerState.src}
              className="h-[78vh] w-full border-0 bg-white"
            />
          ) : (
            <div className="min-h-[70vh] px-6 py-8 md:px-10">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: viewerState.html }}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
