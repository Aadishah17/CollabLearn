import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, X, Sparkles, Loader2, Map } from 'lucide-react';
import { API_URL } from '../../config';

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

const sanitizeRoadmapFromResponse = (responseData) => {
  if (!responseData || typeof responseData !== 'object') return null;
  if (!responseData.roadmap || !Array.isArray(responseData.roadmap.steps)) return null;
  return responseData.roadmap;
};

const extractSkillFromPrompt = (text, fallbackSkill = '') => {
  const cleaned = String(text || '')
    .replace(/roadmap/gi, '')
    .replace(/plan/gi, '')
    .replace(/for/gi, '')
    .replace(/please/gi, '')
    .trim();

  if (cleaned.length >= 2) return cleaned;
  if (fallbackSkill) return fallbackSkill;
  return 'General Learning';
};

const AiChatbot = ({ defaultSkill = '', context = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'I am your AI learning mentor. Ask for study strategy help or type "roadmap for <skill>" to generate a plan.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inlineRoadmap, setInlineRoadmap] = useState(null);
  const messagesEndRef = useRef(null);

  const normalizedContext = {
    learnerLevel: context.learnerLevel || 'Beginner',
    weeklyHours: Number(context.weeklyHours) || 6,
    targetWeeks: Number(context.targetWeeks) || 8,
    progressPercentage: Number(context.progressPercentage) || 0,
    focusAreas: Array.isArray(context.focusAreas) ? context.focusAreas : [],
    roadmapSummary: context.roadmapSummary || '',
    currentStepTitle: context.currentStepTitle || '',
    currentStepDescription: context.currentStepDescription || ''
  };

  const quickPrompts = useMemo(() => {
    const skillLabel = defaultSkill || 'my skill';
    return [
      `What should I do in my next ${Math.max(1, Math.round(normalizedContext.weeklyHours / 2))}-hour study block?`,
      `Roadmap for ${skillLabel}`,
      `Explain "${normalizedContext.currentStepTitle || 'my current roadmap step'}" in simple terms`,
      'How do I stay consistent every week?'
    ];
  }, [defaultSkill, normalizedContext.currentStepTitle, normalizedContext.weeklyHours]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, inlineRoadmap]);

  const handleSendMessage = async (forcedMessage = null) => {
    const rawInput = forcedMessage ?? input;
    const messageText = String(rawInput || '').trim();
    if (!messageText) return;

    if (!forcedMessage) {
      setInput('');
    }

    setMessages((prev) => [...prev, { role: 'user', content: messageText }]);
    setIsLoading(true);
    setInlineRoadmap(null);

    try {
      const isRoadmapIntent = /roadmap|plan/i.test(messageText);

      if (isRoadmapIntent) {
        const requestedSkill = extractSkillFromPrompt(messageText, defaultSkill);
        const roadmapResponse = await fetch(`${API_URL}/api/ai/roadmap`, {
          method: 'POST',
          headers: buildAuthHeaders(),
          body: JSON.stringify({
            skill: requestedSkill,
            learnerLevel: normalizedContext.learnerLevel,
            weeklyHours: normalizedContext.weeklyHours,
            targetWeeks: normalizedContext.targetWeeks,
            focusAreas: normalizedContext.focusAreas,
            savePlan: false
          })
        });

        const roadmapData = await roadmapResponse.json();
        const normalizedRoadmap = sanitizeRoadmapFromResponse(roadmapData);

        if (!roadmapResponse.ok || !roadmapData.success || !normalizedRoadmap) {
          throw new Error(roadmapData.message || 'Could not generate roadmap');
        }

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Here is your roadmap for ${requestedSkill}.` }
        ]);
        setInlineRoadmap(normalizedRoadmap);
        return;
      }

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          message: messageText,
          skillContext: defaultSkill || 'General learning',
          learnerLevel: normalizedContext.learnerLevel,
          context: normalizedContext
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'AI chat failed');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('AI chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I could not complete that request. Please try again in a moment.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
          aria-label="Open AI mentor chat"
        >
          <Sparkles size={22} />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[620px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
          <div className="px-4 py-3 bg-gradient-to-r from-red-700 to-red-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span className="font-semibold text-sm">AI Learning Mentor</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-white/15 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="px-4 pt-3 pb-2 bg-zinc-900 border-b border-zinc-800">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs px-2 py-1 rounded-full border border-zinc-700 text-zinc-300 hover:border-red-600 hover:text-red-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] text-sm p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white rounded-tr-sm'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {inlineRoadmap && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p className="text-sm font-semibold text-red-300 flex items-center gap-2 mb-2">
                  <Map size={16} />
                  Roadmap
                </p>
                <div className="space-y-2">
                  {inlineRoadmap.steps.slice(0, 5).map((step, idx) => (
                    <div key={`${step.title}-${idx}`} className="text-xs text-zinc-300 p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <p className="font-semibold">{idx + 1}. {step.title}</p>
                      <p className="text-zinc-400 mt-1">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="text-xs px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-zinc-800 bg-zinc-950">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for guidance or a roadmap..."
                className="w-full pr-12 pl-3 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-red-600 text-sm"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatbot;
