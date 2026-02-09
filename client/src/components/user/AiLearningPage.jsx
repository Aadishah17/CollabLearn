import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Target,
  Clock3,
  Route,
  CheckCircle2,
  Library,
  Download,
  RefreshCcw,
  ListChecks,
  ShieldCheck,
  CircleAlert,
  Cpu
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainNavbar from '../../navbar/mainNavbar';
import AiChatbot from './AiChatbot';
import { API_URL } from '../../config';

const levelOptions = ['Beginner', 'Intermediate', 'Advanced'];

const defaultFormState = {
  skill: '',
  learnerLevel: 'Beginner',
  weeklyHours: 6,
  targetWeeks: 8,
  focusAreas: ''
};

const parseFocusAreas = (focusAreas) =>
  String(focusAreas || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const sanitizeCoachNote = (note) =>
  String(note || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const buildAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

const AiLearningPage = () => {
  const [formState, setFormState] = useState(defaultFormState);
  const [roadmap, setRoadmap] = useState(null);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [completedStepIndexes, setCompletedStepIndexes] = useState([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingSavedPlans, setLoadingSavedPlans] = useState(true);
  const [syncingProgress, setSyncingProgress] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [error, setError] = useState('');
  const [studioStatus, setStudioStatus] = useState(null);
  const [checkingStudio, setCheckingStudio] = useState(false);
  const [roadmapMeta, setRoadmapMeta] = useState({ source: null, provider: null, model: null });
  const [studySession, setStudySession] = useState(null);
  const [loadingStudySession, setLoadingStudySession] = useState(false);
  const [studySessionError, setStudySessionError] = useState('');
  const [stepCoachNotes, setStepCoachNotes] = useState({});
  const [loadingStepCoachIndex, setLoadingStepCoachIndex] = useState(null);

  const progressPercentage = useMemo(() => {
    if (!roadmap?.steps?.length) return 0;
    return Math.round((completedStepIndexes.length / roadmap.steps.length) * 100);
  }, [roadmap, completedStepIndexes]);

  const nextStep = useMemo(() => {
    if (!roadmap?.steps?.length) return null;
    const candidateIndex = roadmap.steps.findIndex((_, index) => !completedStepIndexes.includes(index));
    const safeIndex = candidateIndex === -1 ? roadmap.steps.length - 1 : candidateIndex;
    const step = roadmap.steps[safeIndex];
    return step
      ? {
          index: safeIndex,
          title: step.title,
          description: step.description,
          goals: Array.isArray(step.goals) ? step.goals : []
        }
      : null;
  }, [roadmap, completedStepIndexes]);

  const aiChatContext = useMemo(
    () => ({
      learnerLevel: formState.learnerLevel,
      weeklyHours: Number(formState.weeklyHours) || 6,
      targetWeeks: Number(formState.targetWeeks) || 8,
      progressPercentage,
      focusAreas: parseFocusAreas(formState.focusAreas),
      roadmapSummary: roadmap?.summary || '',
      currentStepTitle: nextStep?.title || '',
      currentStepDescription: nextStep?.description || ''
    }),
    [formState, progressPercentage, roadmap, nextStep]
  );

  const topVideoResource = useMemo(() => {
    if (!Array.isArray(roadmap?.resources)) return null;
    return roadmap.resources.find((resource) => String(resource?.type || '').toLowerCase() === 'video') || null;
  }, [roadmap]);

  const fetchSavedPlans = async () => {
    setLoadingSavedPlans(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/plans`, {
        headers: buildAuthHeaders()
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch saved plans');
      }

      setSavedPlans(data.plans || []);
    } catch (err) {
      console.error('Saved plans fetch error:', err);
    } finally {
      setLoadingSavedPlans(false);
    }
  };

  const fetchStudioStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/studio-status`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch AI Studio status');
      }

      setStudioStatus(data);
    } catch (err) {
      console.error('AI Studio status error:', err);
      setStudioStatus({
        configured: false,
        provider: 'google-ai-studio',
        modelCandidates: []
      });
    }
  };

  useEffect(() => {
    fetchSavedPlans();
    fetchStudioStatus();
  }, []);

  const handleInputChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateRoadmap = async (event) => {
    event.preventDefault();

    if (!formState.skill.trim()) {
      setError('Please enter a skill to generate your roadmap.');
      return;
    }

    setLoadingRoadmap(true);
    setError('');

    try {
      const payload = {
        skill: formState.skill.trim(),
        learnerLevel: formState.learnerLevel,
        weeklyHours: Number(formState.weeklyHours),
        targetWeeks: Number(formState.targetWeeks),
        focusAreas: parseFocusAreas(formState.focusAreas),
        savePlan: true
      };

      const response = await fetch(`${API_URL}/api/ai/roadmap`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate roadmap');
      }

      setRoadmap(data.roadmap);
      setRoadmapMeta({
        source: data.source || null,
        provider: data.provider || null,
        model: data.model || null
      });
      setSavedPlanId(data.savedPlanId || null);
      setCompletedStepIndexes([]);
      setStudySession(null);
      setStudySessionError('');
      setStepCoachNotes({});
      toast.success('Personalized roadmap generated');

      if (data.savedPlanId) {
        fetchSavedPlans();
      }
    } catch (err) {
      console.error('Roadmap generation error:', err);
      setError(err.message || 'Unable to generate roadmap right now.');
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const loadSavedPlan = (plan) => {
    setFormState({
      skill: plan.skill || '',
      learnerLevel: plan.learnerLevel || 'Beginner',
      weeklyHours: plan.weeklyHours || 6,
      targetWeeks: plan.targetWeeks || 8,
      focusAreas: Array.isArray(plan.focusAreas) ? plan.focusAreas.join(', ') : ''
    });
    setRoadmap(plan.plan || null);
    setRoadmapMeta({
      source: plan.source || 'fallback',
      provider: plan.source === 'ai' ? 'google-ai-studio' : 'fallback',
      model: null
    });
    setSavedPlanId(plan._id || null);
    setCompletedStepIndexes(plan.completedStepIndexes || []);
    setStudySession(null);
    setStudySessionError('');
    setStepCoachNotes({});
    setError('');
  };

  const syncProgress = async (nextIndexes) => {
    if (!savedPlanId) return;

    setSyncingProgress(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/plans/${savedPlanId}/progress`, {
        method: 'PATCH',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ completedStepIndexes: nextIndexes })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to sync progress');
      }
      fetchSavedPlans();
    } catch (err) {
      console.error('Progress sync error:', err);
      toast.error('Could not sync progress to server');
    } finally {
      setSyncingProgress(false);
    }
  };

  const toggleStepCompletion = (index) => {
    const next = completedStepIndexes.includes(index)
      ? completedStepIndexes.filter((item) => item !== index)
      : [...completedStepIndexes, index].sort((a, b) => a - b);

    setCompletedStepIndexes(next);
    syncProgress(next);
  };

  const exportCurrentPlan = () => {
    if (!roadmap?.steps?.length) return;

    const markdown = [
      `# ${formState.skill} Learning Plan`,
      '',
      `- Level: ${formState.learnerLevel}`,
      `- Weekly Hours: ${formState.weeklyHours}`,
      `- Target Weeks: ${formState.targetWeeks}`,
      `- Focus Areas: ${formState.focusAreas || 'General mastery'}`,
      '',
      '## Summary',
      roadmap.summary || '',
      '',
      '## Roadmap Steps',
      ...roadmap.steps.map(
        (step, idx) =>
          `${idx + 1}. ${step.title}\n   - ${step.description}\n   - Practice: ${step.practiceTask || 'Complete a practical exercise'}`
      ),
      '',
      '## Milestones',
      ...(roadmap.milestones || []).map(
        (milestone) => `- Week ${milestone.week}: ${milestone.title} - ${milestone.successCriteria}`
      ),
      '',
      '## Resources',
      ...(roadmap.resources || []).map((resource) => `- [${resource.title}](${resource.url}) (${resource.type})`)
    ].join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${formState.skill.replace(/\s+/g, '-').toLowerCase() || 'learning-plan'}.md`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const verifyStudioConnection = async () => {
    setCheckingStudio(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/studio-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'AI Studio verification failed');
      }

      toast.success(`AI Studio connected (${data.model || 'model selected'})`);
      fetchStudioStatus();
    } catch (err) {
      console.error('AI Studio verify error:', err);
      toast.error(err.message || 'Could not verify AI Studio connection');
    } finally {
      setCheckingStudio(false);
    }
  };

  const generateStudySession = async () => {
    if (!roadmap?.steps?.length) {
      toast.error('Generate a roadmap first');
      return;
    }

    setLoadingStudySession(true);
    setStudySessionError('');

    try {
      const payload = {
        skill: formState.skill.trim(),
        learnerLevel: formState.learnerLevel,
        weeklyHours: Number(formState.weeklyHours),
        availableMinutes: Math.min(180, Math.max(45, Math.round((Number(formState.weeklyHours) || 6) * 10))),
        focusAreas: parseFocusAreas(formState.focusAreas),
        progressPercentage,
        roadmap: {
          summary: roadmap.summary || '',
          currentStepTitle: nextStep?.title || '',
          currentStepDescription: nextStep?.description || '',
          currentStepGoals: nextStep?.goals || []
        }
      };

      const response = await fetch(`${API_URL}/api/ai/study-session`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.session) {
        throw new Error(data.message || 'Failed to generate study session');
      }

      setStudySession(data.session);
      toast.success('AI study session generated');
    } catch (err) {
      console.error('Study session error:', err);
      setStudySessionError(err.message || 'Unable to generate study session right now.');
    } finally {
      setLoadingStudySession(false);
    }
  };

  const getStepCoachGuidance = async (step, index) => {
    if (!step) return;

    setLoadingStepCoachIndex(index);
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          message: `Coach me for this roadmap step: ${step.title}. Give me one clear study sequence for today.`,
          skillContext: formState.skill || 'General learning',
          learnerLevel: formState.learnerLevel,
          context: {
            ...aiChatContext,
            currentStepTitle: step.title,
            currentStepDescription: step.description
          }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.response) {
        throw new Error(data.message || 'Failed to fetch step guidance');
      }

      setStepCoachNotes((prev) => ({ ...prev, [index]: sanitizeCoachNote(data.response) }));
    } catch (err) {
      console.error('Step coach error:', err);
      toast.error('Could not get AI step guidance');
    } finally {
      setLoadingStepCoachIndex(null);
    }
  };

  return (
    <div className="min-h-screen glass-page text-zinc-100">
      <MainNavbar />

      <main className="max-w-7xl mx-auto pt-28 pb-12 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
          <aside className="glass-panel p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Library size={18} className="text-red-400" />
                Saved Plans
              </h2>
              <button
                type="button"
                onClick={fetchSavedPlans}
                className="text-zinc-400 hover:text-red-400 transition-colors"
                title="Refresh plans"
              >
                <RefreshCcw size={16} />
              </button>
            </div>

            {loadingSavedPlans ? (
              <p className="text-sm text-zinc-400">Loading your plans...</p>
            ) : savedPlans.length === 0 ? (
              <p className="text-sm text-zinc-400">No plans yet. Generate your first roadmap.</p>
            ) : (
              <div className="space-y-3">
                {savedPlans.map((plan) => (
                  <button
                    key={plan._id}
                    type="button"
                    onClick={() => loadSavedPlan(plan)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      savedPlanId === plan._id
                        ? 'bg-red-900/30 border-red-500'
                        : 'bg-black/25 border-white/10 hover:border-red-400/55'
                    }`}
                  >
                    <p className="font-medium text-zinc-100">{plan.skill}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {plan.learnerLevel} - {plan.progressPercentage || 0}% complete
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Updated {new Date(plan.updatedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-zinc-800 pt-4">
              <h3 className="text-sm font-semibold text-zinc-200 mb-2">Learning sprint tips</h3>
              <ul className="text-xs text-zinc-400 space-y-2">
                <li>Protect your weekly study slots like calendar meetings.</li>
                <li>Build small projects every week to lock in retention.</li>
                <li>Use checkpoints to decide what to repeat or level up.</li>
              </ul>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="glass-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-red-400 font-semibold">
                    <Sparkles size={14} />
                    AI Learning Studio
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold mt-2">Build your personalized skill roadmap</h1>
                  <p className="text-zinc-400 mt-2 text-sm">
                    Generate a focused plan, track your progress, and keep all study resources in one place.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`glass-chip ${
                      studioStatus?.configured
                        ? 'border-emerald-500/45 text-emerald-200 bg-emerald-900/25'
                        : 'border-amber-500/45 text-amber-200 bg-amber-900/25'
                    }`}
                  >
                    {studioStatus?.configured ? <ShieldCheck size={14} /> : <CircleAlert size={14} />}
                    {studioStatus?.configured ? 'AI Studio Connected' : 'AI Studio Not Configured'}
                  </span>

                  {studioStatus?.modelCandidates?.[0] && (
                    <span className="glass-chip border-white/20">
                      <Cpu size={14} />
                      {studioStatus.modelCandidates[0]}
                    </span>
                  )}

                  {roadmapMeta.source && (
                    <span className="glass-chip border-white/20">
                      <Sparkles size={14} />
                      {roadmapMeta.source === 'ai' ? 'AI-generated plan' : 'Fallback plan'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={verifyStudioConnection}
                    disabled={checkingStudio}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 border border-white/12 hover:border-red-500/65 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {checkingStudio ? 'Verifying...' : 'Verify AI Studio'}
                  </button>

                  <button
                    type="button"
                    onClick={generateStudySession}
                    disabled={loadingStudySession || !roadmap?.steps?.length}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 border border-white/12 hover:border-red-500/65 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingStudySession ? 'Building session...' : 'Generate Study Session'}
                  </button>

                  <button
                    type="button"
                    onClick={exportCurrentPlan}
                    disabled={!roadmap?.steps?.length}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 border border-white/12 hover:border-red-500/65 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download size={16} />
                    Export Plan
                  </button>
                </div>
              </div>

              <form onSubmit={handleGenerateRoadmap} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-zinc-300 mb-2">Skill to learn</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                      type="text"
                      value={formState.skill}
                      onChange={(event) => handleInputChange('skill', event.target.value)}
                      placeholder="Examples: React, Public Speaking, UI Design, Data Analysis"
                      className="glass-input pl-10 pr-4 py-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Current level</label>
                  <select
                    value={formState.learnerLevel}
                    onChange={(event) => handleInputChange('learnerLevel', event.target.value)}
                    className="glass-input px-3 py-3"
                  >
                    {levelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Weekly study hours</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={formState.weeklyHours}
                    onChange={(event) => handleInputChange('weeklyHours', event.target.value)}
                    className="glass-input px-3 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Target duration (weeks)</label>
                  <input
                    type="number"
                    min={2}
                    max={52}
                    value={formState.targetWeeks}
                    onChange={(event) => handleInputChange('targetWeeks', event.target.value)}
                    className="glass-input px-3 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">Focus areas (comma separated)</label>
                  <input
                    type="text"
                    value={formState.focusAreas}
                    onChange={(event) => handleInputChange('focusAreas', event.target.value)}
                    placeholder="Portfolio project, interview prep, fundamentals"
                    className="glass-input px-3 py-3"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loadingRoadmap}
                    className="w-full md:w-auto glass-cta px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
                  >
                    {loadingRoadmap ? 'Generating plan...' : 'Generate AI roadmap'}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-900/30 border border-red-700 text-red-200 text-sm">
                  {error}
                </div>
              )}
              {studySessionError && (
                <div className="mt-3 p-3 rounded-xl bg-amber-900/25 border border-amber-700 text-amber-100 text-sm">
                  {studySessionError}
                </div>
              )}
            </div>

            {roadmap?.steps?.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel p-4">
                    <p className="text-xs uppercase text-zinc-400">Estimated timeline</p>
                    <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                      <Clock3 size={18} className="text-red-400" />
                      {formState.targetWeeks} weeks
                    </p>
                  </div>
                  <div className="glass-panel p-4">
                    <p className="text-xs uppercase text-zinc-400">Roadmap steps</p>
                    <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                      <Route size={18} className="text-red-400" />
                      {roadmap.steps.length} modules
                    </p>
                  </div>
                  <div className="glass-panel p-4">
                    <p className="text-xs uppercase text-zinc-400">Completion</p>
                    <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-red-400" />
                      {progressPercentage}% {syncingProgress ? '(syncing...)' : ''}
                    </p>
                  </div>
                </div>

                <div className="glass-panel p-6">
                  <h2 className="text-xl font-semibold mb-2">Learning summary</h2>
                  <p className="text-zinc-300 text-sm leading-relaxed">{roadmap.summary}</p>
                </div>

                {topVideoResource && (
                  <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold mb-2">Video guidance</h2>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      Open the top YouTube guidance for this skill and use it as your primary walkthrough for the current phase.
                    </p>
                    <a
                      href={topVideoResource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/35 border border-red-600/60 hover:border-red-400 transition-colors text-sm"
                    >
                      Watch: {topVideoResource.title}
                    </a>
                    {topVideoResource.reason && (
                      <p className="mt-2 text-xs text-zinc-400">{topVideoResource.reason}</p>
                    )}
                  </div>
                )}

                {studySession && (
                  <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold mb-2">AI next study session</h2>
                    <p className="text-zinc-300 text-sm leading-relaxed">{studySession.summary}</p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(studySession.tasks || []).map((task, index) => (
                        <div key={`${task.title}-${index}`} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                          <p className="text-sm font-semibold text-red-300">
                            {index + 1}. {task.title} ({task.minutes} min)
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">{task.instructions}</p>
                          <p className="text-xs text-zinc-500 mt-2">Output: {task.output}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-200 mb-2">Reflection questions</p>
                        <ul className="text-xs text-zinc-400 space-y-1">
                          {(studySession.reflectionQuestions || []).map((item, index) => (
                            <li key={`${item}-${index}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                        <p className="text-sm font-semibold text-zinc-200 mb-2">Pitfalls to avoid</p>
                        <ul className="text-xs text-zinc-400 space-y-1">
                          {(studySession.pitfalls || []).map((item, index) => (
                            <li key={`${item}-${index}`}>- {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="glass-panel p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ListChecks size={18} className="text-red-400" />
                    Roadmap steps
                  </h2>
                  <div className="space-y-4">
                    {roadmap.steps.map((step, index) => {
                      const isCompleted = completedStepIndexes.includes(index);
                      return (
                        <div
                          key={`${step.title}-${index}`}
                          className={`rounded-xl border p-4 transition-colors ${
                            isCompleted
                              ? 'bg-emerald-900/20 border-emerald-700'
                              : 'bg-black/25 border-white/10 hover:border-red-400/55'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">
                                {index + 1}. {step.title}
                              </h3>
                              <p className="text-sm text-zinc-400 mt-1">{step.description}</p>
                              {step.practiceTask && (
                                <p className="text-xs text-zinc-500 mt-2">
                                  Practice task: {step.practiceTask}
                                </p>
                              )}
                              {Array.isArray(step.goals) && step.goals.length > 0 && (
                                <ul className="text-xs text-zinc-400 mt-2 space-y-1">
                                  {step.goals.map((goal, goalIndex) => (
                                    <li key={`${goal}-${goalIndex}`}>- {goal}</li>
                                  ))}
                                </ul>
                              )}
                              {stepCoachNotes[index] && (
                                <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                  <p className="text-[11px] uppercase tracking-wide text-red-300 mb-1">AI coach note</p>
                                  <p className="text-xs text-zinc-300 leading-relaxed">{stepCoachNotes[index]}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                onClick={() => getStepCoachGuidance(step, index)}
                                disabled={loadingStepCoachIndex === index}
                                className="px-3 py-2 text-xs rounded-lg border bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loadingStepCoachIndex === index ? 'AI thinking...' : 'AI coach'}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStepCompletion(index)}
                                className={`px-3 py-2 text-xs rounded-lg border ${
                                  isCompleted
                                    ? 'bg-emerald-700/30 border-emerald-600 text-emerald-200'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-red-600'
                                }`}
                              >
                                {isCompleted ? 'Completed' : 'Mark done'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold mb-4">Milestones</h2>
                    <div className="space-y-3">
                      {(roadmap.milestones || []).map((milestone, index) => (
                        <div key={`${milestone.title}-${index}`} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                          <p className="text-sm font-semibold text-red-300">
                            Week {milestone.week}: {milestone.title}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">{milestone.successCriteria}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-6">
                    <h2 className="text-xl font-semibold mb-4">Resources</h2>
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {(roadmap.resources || []).map((resource, index) => (
                        <a
                          key={`${resource.title}-${index}`}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-black/25 border border-white/10 hover:border-red-400/55 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">{resource.title}</p>
                            <span className="text-[10px] uppercase tracking-wide text-zinc-400">{resource.type}</span>
                          </div>
                          {resource.reason && <p className="text-xs text-zinc-400 mt-1">{resource.reason}</p>}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <AiChatbot defaultSkill={formState.skill} context={aiChatContext} />
    </div>
  );
};

export default AiLearningPage;


