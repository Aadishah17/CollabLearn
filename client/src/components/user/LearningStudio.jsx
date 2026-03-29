import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Headphones,
  Presentation,
  GitBranch,
  FileText,
  CreditCard,
  HelpCircle,
  BarChart3,
  Table2,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  ChevronLeft,
  X,
  RotateCcw,
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  Download,
  Shuffle,
  ArrowUpDown,
  Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { requestJson } from '../../services/apiClient';

const STUDIO_TOOLS = [
  { id: 'audio-script', label: 'Audio Overview', icon: Headphones, color: '#ef4444' },
  { id: 'summary-slides', label: 'Slide deck', icon: Presentation, color: '#f97316' },
  { id: 'report', label: 'Reports', icon: FileText, color: '#f59e0b' },
  { id: 'mind-map', label: 'Mind Map', icon: GitBranch, color: '#ef4444' },
  { id: 'notes', label: 'Notes', icon: FileText, color: '#f97316' },
  { id: 'flashcards', label: 'Flashcards', icon: CreditCard, color: '#f59e0b' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, color: '#ef4444' },
  { id: 'infographic-data', label: 'Infographic', icon: BarChart3, color: '#f97316' },
  { id: 'data-table', label: 'Data table', icon: Table2, color: '#f59e0b' },
];

/* ── helpers ── */

const downloadFile = (content, filename, mime = 'text/markdown') => {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getSpeechSynthesisApi = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const { speechSynthesis, SpeechSynthesisUtterance } = window;

  if (
    !speechSynthesis ||
    typeof speechSynthesis.speak !== 'function' ||
    typeof speechSynthesis.cancel !== 'function' ||
    typeof speechSynthesis.pause !== 'function' ||
    typeof speechSynthesis.resume !== 'function' ||
    typeof SpeechSynthesisUtterance !== 'function'
  ) {
    return null;
  }

  return {
    synth: speechSynthesis,
    Utterance: SpeechSynthesisUtterance
  };
};

/* ───── Audio Overview — REAL TTS ───── */

const AudioScript = ({ data }) => {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentPara, setCurrentPara] = useState(-1);
  const [copied, setCopied] = useState(false);
  const speechApiRef = useRef(getSpeechSynthesisApi());
  const intervalRef = useRef(null);
  const playbackSessionRef = useRef(0);

  const paragraphs = data?.paragraphs || [];
  const audioSupported = Boolean(speechApiRef.current);

  const clearKeepAliveInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelAudioPlayback = useCallback(
    (resetProgress = true) => {
      playbackSessionRef.current += 1;
      speechApiRef.current?.synth.cancel();
      clearKeepAliveInterval();
      setPlaying(false);
      setPaused(false);
      if (resetProgress) {
        setProgress(0);
      }
      setCurrentPara(-1);
    },
    [clearKeepAliveInterval]
  );

  const finishPlayback = useCallback(() => {
    clearKeepAliveInterval();
    setPlaying(false);
    setPaused(false);
    setCurrentPara(-1);
  }, [clearKeepAliveInterval]);

  const startKeepAliveInterval = useCallback(() => {
    if (!audioSupported || intervalRef.current) {
      return;
    }

    intervalRef.current = globalThis.setInterval(() => {
      const synth = speechApiRef.current?.synth;
      if (synth?.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 8000);
  }, [audioSupported]);

  useEffect(() => () => {
    playbackSessionRef.current += 1;
    clearKeepAliveInterval();
    speechApiRef.current?.synth.cancel();
  }, [clearKeepAliveInterval]);

  if (!paragraphs.length) return <p className="text-zinc-400 text-sm">No audio script generated.</p>;

  const fullText = paragraphs.join('\n\n');

  const playAudio = () => {
    const speechApi = speechApiRef.current;

    if (!speechApi) {
      toast.error('Audio playback is not supported in this browser.');
      return;
    }

    if (paused) {
      speechApi.synth.resume();
      setPaused(false);
      setPlaying(true);
      startKeepAliveInterval();
      return;
    }

    cancelAudioPlayback(true);
    const playbackSessionId = playbackSessionRef.current;
    setPlaying(true);

    const utts = paragraphs.map((text, i) => {
      const u = new speechApi.Utterance(text);
      u.rate = rate;
      u.pitch = 1;
      u.lang = 'en-US';
      u.onstart = () => {
        if (playbackSessionRef.current !== playbackSessionId) return;
        setCurrentPara(i);
      };
      u.onend = () => {
        if (playbackSessionRef.current !== playbackSessionId) return;
        setProgress(Math.round(((i + 1) / paragraphs.length) * 100));
        if (i === paragraphs.length - 1) {
          finishPlayback();
        }
      };
      u.onerror = () => {
        if (playbackSessionRef.current !== playbackSessionId) return;
        finishPlayback();
      };
      return u;
    });

    utts.forEach((utterance) => speechApi.synth.speak(utterance));

    startKeepAliveInterval();
  };

  const pauseAudio = () => {
    const speechApi = speechApiRef.current;

    if (!speechApi) {
      return;
    }

    speechApi.synth.pause();
    clearKeepAliveInterval();
    setPaused(true);
    setPlaying(false);
  };

  const stopAudio = () => {
    cancelAudioPlayback(true);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="studio-result-panel">
      {/* Player bar */}
      <div className="audio-player">
        <div className="audio-player-controls">
          {!playing ? (
            <button className="audio-play-btn" onClick={playAudio} disabled={!audioSupported}><Play size={20} fill="white" /></button>
          ) : (
            <button className="audio-play-btn" onClick={pauseAudio}><Pause size={20} fill="white" /></button>
          )}
          <button className="studio-nav-btn" onClick={stopAudio} disabled={!playing && !paused}><Square size={14} /></button>
        </div>

        <div className="audio-progress-area">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-zinc-100">{data.title}</p>
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-zinc-400" />
              <select value={rate} onChange={e => setRate(Number(e.target.value))} className="audio-speed-select">
                <option value={0.75}>0.75×</option>
                <option value={1}>1×</option>
                <option value={1.25}>1.25×</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
              </select>
            </div>
          </div>
          <div className="audio-progress-bar">
            <div className="audio-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{data.duration} • {playing ? 'Playing...' : paused ? 'Paused' : progress === 100 ? 'Finished' : 'Ready'}</p>
          {!audioSupported && (
            <p className="text-[11px] text-amber-300 mt-1">Audio playback is not supported in this browser. The transcript is still available.</p>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Transcript</p>
          <button className="studio-nav-btn" onClick={copyAll}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>
        </div>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {paragraphs.map((p, i) => (
            <p key={i} className={`text-sm leading-relaxed transition-colors duration-300 ${currentPara === i ? 'text-white font-medium' : 'text-zinc-400'}`}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ───── Slide Deck — REAL PRESENTATION ───── */

const SLIDE_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  'linear-gradient(135deg, #1e1e2f, #3d1635)',
  'linear-gradient(135deg, #141e30, #243b55)',
  'linear-gradient(135deg, #0d1117, #161b22, #21262d)',
  'linear-gradient(135deg, #1a0a2e, #2d1b69)',
  'linear-gradient(135deg, #0c0c1d, #1b2838)',
  'linear-gradient(135deg, #1c1c2b, #2a1a3e)',
];

const SlidesViewer = ({ data }) => {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);
  const slides = data?.slides || [];

  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setIndex(i => Math.min(i + 1, slides.length - 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen, slides.length]);

  if (!slides.length) return <p className="text-zinc-400 text-sm">No slides generated.</p>;
  const slide = slides[index];
  const bg = SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length];

  const slideContent = (isFs) => (
    <div className={`slide-presentation ${isFs ? 'slide-fullscreen' : ''}`} style={{ background: bg }} ref={containerRef}>
      {isFs && (
        <button className="slide-exit-fs" onClick={() => setFullscreen(false)}><Minimize2 size={18} /> Exit</button>
      )}
      <div className="slide-number">{index + 1} / {slides.length}</div>
      <div className="slide-content-area">
        <h2 className={`slide-title ${isFs ? 'text-5xl' : 'text-2xl'}`}>{slide.title}</h2>
        <p className={`slide-body ${isFs ? 'text-xl' : 'text-sm'}`}>{slide.body}</p>
        {slide.footer && <p className={`slide-footer ${isFs ? 'text-base' : 'text-xs'}`}>{slide.footer}</p>}
      </div>
      <div className="slide-nav">
        <button className="studio-nav-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={16} /></button>
        <div className="slide-dots">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} className={`slide-dot ${i === index ? 'active' : ''}`} />
          ))}
        </div>
        <button className="studio-nav-btn" disabled={index === slides.length - 1} onClick={() => setIndex(index + 1)}><ChevronRight size={16} /></button>
      </div>
    </div>
  );

  if (fullscreen) {
    return <div className="slide-fullscreen-overlay">{slideContent(true)}</div>;
  }

  return (
    <div className="studio-result-panel">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Presentation</p>
        <button className="studio-nav-btn" onClick={() => setFullscreen(true)}><Maximize2 size={14} /> Present</button>
      </div>
      {slideContent(false)}
    </div>
  );
};

/* ───── Flashcards — with Shuffle ───── */

const FlashcardViewer = ({ data }) => {
  const [cards, setCards] = useState(data?.cards || []);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { setCards(data?.cards || []); setIndex(0); setFlipped(false); }, [data]);

  if (!cards.length) return <p className="text-zinc-400 text-sm">No flashcards generated.</p>;

  const doShuffle = () => { setCards(shuffleArray(cards)); setIndex(0); setFlipped(false); toast.success('Cards shuffled'); };

  return (
    <div className="studio-result-panel">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-zinc-400">Flashcards</p>
        <button className="studio-nav-btn" onClick={doShuffle}><Shuffle size={14} /> Shuffle</button>
      </div>
      <div className="flashcard-container" onClick={() => setFlipped(!flipped)}>
        <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <p className="text-xs uppercase tracking-wide text-red-400 mb-2">Question {index + 1}/{cards.length}</p>
            <p className="text-base font-medium">{cards[index].front}</p>
            <p className="text-xs text-zinc-500 mt-4">Click to flip</p>
          </div>
          <div className="flashcard-face flashcard-back">
            <p className="text-xs uppercase tracking-wide text-emerald-400 mb-2">Answer</p>
            <p className="text-sm leading-relaxed">{cards[index].back}</p>
            <p className="text-xs text-zinc-500 mt-4">Click to flip</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 mt-4">
        <button className="studio-nav-btn" disabled={index === 0} onClick={(e) => { e.stopPropagation(); setFlipped(false); setIndex(index - 1); }}><ChevronLeft size={16} /></button>
        <span className="text-xs text-zinc-400">{index + 1} / {cards.length}</span>
        <button className="studio-nav-btn" disabled={index === cards.length - 1} onClick={(e) => { e.stopPropagation(); setFlipped(false); setIndex(index + 1); }}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
};

/* ───── Quiz — already interactive ───── */

const QuizPanel = ({ data }) => {
  const questions = data?.questions || [];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  if (!questions.length) return <p className="text-zinc-400 text-sm">No quiz generated.</p>;
  const q = questions[current];
  const isAnswered = selected !== null;

  const handleSelect = (optIndex) => {
    if (isAnswered) return;
    setSelected(optIndex);
    setAnswered(answered + 1);
    if (optIndex === q.correctIndex) setScore(score + 1);
  };

  const next = () => { setSelected(null); setCurrent(current + 1); };

  if (current >= questions.length) {
    return (
      <div className="studio-result-panel text-center">
        <p className="text-4xl mb-3">{score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '🎉' : '📚'}</p>
        <p className="text-2xl font-bold text-red-400">Quiz Complete!</p>
        <p className="text-lg mt-2">{score}/{questions.length} correct</p>
        <div className="quiz-score-bar mt-3"><div className="quiz-score-fill" style={{ width: `${(score / questions.length) * 100}%` }} /></div>
        <button className="studio-nav-btn mt-4" onClick={() => { setCurrent(0); setSelected(null); setScore(0); setAnswered(0); }}><RotateCcw size={14} /> Retry</button>
      </div>
    );
  }

  return (
    <div className="studio-result-panel">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-red-400">Question {current + 1}/{questions.length}</p>
        <p className="text-xs text-zinc-400">Score: {score}/{answered}</p>
      </div>
      <div className="quiz-progress-bar mb-4"><div className="quiz-progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} /></div>
      <p className="text-base font-medium mb-4">{q.question}</p>
      <div className="space-y-2">
        {(q.options || []).map((opt, oi) => (
          <button key={oi} onClick={() => handleSelect(oi)}
            className={`quiz-option ${isAnswered ? (oi === q.correctIndex ? 'correct' : oi === selected ? 'wrong' : '') : ''}`}>
            <span className="quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
            {opt}
          </button>
        ))}
      </div>
      {isAnswered && q.explanation && (
        <div className="mt-3 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
          <p className="text-xs text-zinc-300">💡 {q.explanation}</p>
        </div>
      )}
      {isAnswered && (
        <button className="studio-nav-btn mt-3" onClick={next}>
          {current === questions.length - 1 ? 'See Results' : <>Next <ChevronRight size={14} /></>}
        </button>
      )}
    </div>
  );
};

/* ───── Mind Map — VISUAL SVG ───── */

const MindMapView = ({ data }) => {
  if (!data?.root) return <p className="text-zinc-400 text-sm">No mind map generated.</p>;
  const branches = data.branches || [];
  const svgW = 900, svgH = Math.max(500, branches.length * 120);
  const cx = svgW / 2, cy = svgH / 2;

  return (
    <div className="studio-result-panel">
      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="mind-map-svg">
          {/* root */}
          <rect x={cx - 100} y={cy - 22} width={200} height={44} rx={12} fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" strokeWidth={2} />
          <text x={cx} y={cy + 6} textAnchor="middle" fill="#fca5a5" fontSize={16} fontWeight={700}>{data.root}</text>

          {branches.map((branch, i) => {
            const angle = ((i / branches.length) * 2 * Math.PI) - Math.PI / 2;
            const branchR = 180;
            const bx = cx + Math.cos(angle) * branchR;
            const by = cy + Math.sin(angle) * branchR;
            const children = branch.children || [];

            return (
              <g key={i}>
                {/* line root → branch */}
                <line x1={cx} y1={cy} x2={bx} y2={by} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
                {/* branch box */}
                <rect x={bx - 80} y={by - 18} width={160} height={36} rx={10} fill="rgba(255,255,255,0.05)" stroke="rgba(249,115,22,0.4)" strokeWidth={1.5} />
                <text x={bx} y={by + 5} textAnchor="middle" fill="#fdba74" fontSize={13} fontWeight={600}>{branch.label}</text>

                {children.map((child, ci) => {
                  const childAngle = angle + ((ci - (children.length - 1) / 2) * 0.35);
                  const childR = 130;
                  const childX = bx + Math.cos(childAngle) * childR;
                  const childY = by + Math.sin(childAngle) * childR;
                  return (
                    <g key={ci}>
                      <line x1={bx} y1={by} x2={childX} y2={childY} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 3" />
                      <rect x={childX - 65} y={childY - 14} width={130} height={28} rx={8} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                      <text x={childX} y={childY + 4} textAnchor="middle" fill="#a1a1aa" fontSize={11}>{child.label}</text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/* ───── Notes — with Download ───── */

const NotesPanel = ({ data }) => {
  if (!data?.sections?.length) return <p className="text-zinc-400 text-sm">No notes generated.</p>;
  const exportNotes = () => {
    const md = [`# ${data.title}\n`, ...data.sections.map(s => `## ${s.heading}\n${(s.bullets || []).map(b => `- ${b}`).join('\n')}`)].join('\n\n');
    downloadFile(md, `${(data.title || 'notes').replace(/\s+/g, '-').toLowerCase()}.md`);
    toast.success('Notes downloaded');
  };
  return (
    <div className="studio-result-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <button className="studio-nav-btn" onClick={exportNotes}><Download size={14} /> Download .md</button>
      </div>
      {data.sections.map((section, i) => (
        <div key={i} className="mb-4">
          <h4 className="text-sm font-semibold text-red-300 mb-2">{section.heading}</h4>
          <ul className="space-y-1">
            {(section.bullets || []).map((bullet, bi) => (
              <li key={bi} className="text-sm text-zinc-300 flex items-start gap-2"><span className="text-red-400 mt-1">•</span> {bullet}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

/* ───── Report — with Download ───── */

const ReportView = ({ data }) => {
  if (!data?.sections?.length) return <p className="text-zinc-400 text-sm">No report generated.</p>;
  const exportReport = () => {
    const md = [`# ${data.title}\n`, data.executive_summary ? `> ${data.executive_summary}\n` : '', ...data.sections.map(s => `## ${s.heading}\n${s.content}`), data.recommendations?.length ? `## Recommendations\n${data.recommendations.map(r => `- ${r}`).join('\n')}` : ''].filter(Boolean).join('\n\n');
    downloadFile(md, `${(data.title || 'report').replace(/\s+/g, '-').toLowerCase()}.md`);
    toast.success('Report downloaded');
  };
  return (
    <div className="studio-result-panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <button className="studio-nav-btn" onClick={exportReport}><Download size={14} /> Download .md</button>
      </div>
      {data.executive_summary && <p className="text-sm text-zinc-300 mb-4 italic border-l-2 border-red-500/40 pl-3">{data.executive_summary}</p>}
      {data.sections.map((section, i) => (
        <div key={i} className="mb-4">
          <h4 className="text-sm font-semibold text-red-300 mb-1">{section.heading}</h4>
          <p className="text-sm text-zinc-400 leading-relaxed">{section.content}</p>
        </div>
      ))}
      {data.recommendations?.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
          <h4 className="text-sm font-semibold text-zinc-200 mb-2">Recommendations</h4>
          <ul className="space-y-1">{data.recommendations.map((r, i) => <li key={i} className="text-xs text-zinc-400">✅ {r}</li>)}</ul>
        </div>
      )}
    </div>
  );
};

/* ───── Infographic — VISUAL ───── */

const InfographicView = ({ data }) => {
  if (!data?.stats?.length) return <p className="text-zinc-400 text-sm">No infographic data generated.</p>;
  return (
    <div className="studio-result-panel">
      <div className="infographic-header">
        <h3 className="text-xl font-bold">{data.title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-5">
        {data.stats.map((stat, i) => (
          <div key={i} className="infographic-stat-card">
            <span className="text-3xl mb-1">{stat.icon}</span>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
            <p className="text-base font-bold text-zinc-100 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
      {data.facts?.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-semibold text-zinc-200 mb-2">💡 Key Facts</h4>
          {data.facts.map((fact, i) => (
            <div key={i} className="infographic-fact">
              <div className="infographic-fact-bar" style={{ width: `${Math.min(100, 60 + i * 8)}%` }} />
              <p className="text-xs text-zinc-300 relative z-1">{fact}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ───── Data Table — Sort + CSV Export ───── */

const DataTableView = ({ data }) => {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  if (!data?.columns?.length || !data?.rows?.length) return <p className="text-zinc-400 text-sm">No data table generated.</p>;

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(colIdx); setSortDir('asc'); }
  };

  const sortedRows = [...data.rows];
  if (sortCol !== null) {
    sortedRows.sort((a, b) => {
      const va = (Array.isArray(a) ? a[sortCol] : '') || '';
      const vb = (Array.isArray(b) ? b[sortCol] : '') || '';
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }

  const exportCSV = () => {
    const escape = v => `"${String(v || '').replace(/"/g, '""')}"`;
    const csv = [data.columns.map(escape).join(','), ...sortedRows.map(r => (Array.isArray(r) ? r : []).map(escape).join(','))].join('\n');
    downloadFile(csv, `${(data.title || 'table').replace(/\s+/g, '-').toLowerCase()}.csv`, 'text/csv');
    toast.success('Table exported as CSV');
  };

  return (
    <div className="studio-result-panel">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <button className="studio-nav-btn" onClick={exportCSV}><Download size={14} /> Export CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="studio-table">
          <thead>
            <tr>
              {data.columns.map((col, i) => (
                <th key={i} onClick={() => handleSort(i)} className="cursor-pointer select-none">
                  <span className="inline-flex items-center gap-1">{col} <ArrowUpDown size={12} className={sortCol === i ? 'text-red-400' : 'text-zinc-600'} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, ri) => (
              <tr key={ri}>{(Array.isArray(row) ? row : []).map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ───── Viewer Registry ───── */

const RESULT_VIEWERS = {
  flashcards: FlashcardViewer,
  quiz: QuizPanel,
  'mind-map': MindMapView,
  notes: NotesPanel,
  'summary-slides': SlidesViewer,
  'audio-script': AudioScript,
  report: ReportView,
  'infographic-data': InfographicView,
  'data-table': DataTableView,
};

/* ───── Main component ───── */

const LearningStudio = ({ skill, learnerLevel, roadmapSummary, currentStepTitle, currentStepDescription, focusAreas, hasRoadmap }) => {
  const [activeTool, setActiveTool] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultTool, setResultTool] = useState(null);

  const handleToolClick = async (toolId) => {
    if (!hasRoadmap || loading) return;

    // Stop any playing audio when switching tools
    window.speechSynthesis?.cancel();

    setActiveTool(toolId);
    setLoading(true);
    setResult(null);
    setResultTool(null);

    try {
      const data = await requestJson('/api/ai/studio-tool', {
        method: 'POST',
        body: { tool: toolId, skill, learnerLevel, roadmapSummary, currentStepTitle, currentStepDescription, focusAreas },
        auth: true
      });

      if (!data.result) throw new Error(data.message || 'No result from studio tool');

      setResult(data.result);
      setResultTool(toolId);
      toast.success(`${STUDIO_TOOLS.find(t => t.id === toolId)?.label || 'Tool'} generated`);
    } catch (err) {
      console.error('Studio tool error:', err);
      toast.error(err.message || 'Failed to generate studio content');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    window.speechSynthesis?.cancel();
    setResult(null);
    setResultTool(null);
    setActiveTool(null);
  };

  const ResultViewer = resultTool ? RESULT_VIEWERS[resultTool] : null;

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-red-400 font-semibold mb-1">Studio</p>
          <h2 className="text-xl font-semibold">Learning Studio</h2>
        </div>
        {resultTool && (
          <button className="studio-nav-btn" onClick={handleClose}><X size={14} /> Close</button>
        )}
      </div>

      <div className="studio-grid">
        {STUDIO_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id && loading;
          const isDisabled = !hasRoadmap;

          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              disabled={isDisabled || loading}
              className={`studio-card ${isDisabled ? 'disabled' : ''} ${activeTool === tool.id && resultTool === tool.id ? 'active' : ''}`}
              style={{ '--studio-accent': tool.color }}
              title={isDisabled ? 'Generate a roadmap first' : `Generate ${tool.label}`}
            >
              <div className="studio-card-icon">
                {isActive ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
              </div>
              <span className="studio-card-label">{tool.label}</span>
              <ChevronRight size={14} className="studio-card-arrow" />
            </button>
          );
        })}
      </div>

      {loading && !result && (
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 size={20} className="animate-spin text-red-400" />
          <p className="text-sm text-zinc-400">Generating {STUDIO_TOOLS.find(t => t.id === activeTool)?.label || 'content'}...</p>
        </div>
      )}

      {ResultViewer && result && (
        <div className="mt-6">
          <ResultViewer data={result} />
        </div>
      )}
    </div>
  );
};

export default LearningStudio;
