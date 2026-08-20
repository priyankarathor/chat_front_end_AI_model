import { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Youtube,
  Sparkles,
  Loader2,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import type { ChatSource } from '@/types';

interface UploadScreenProps {
  onComplete: (source: ChatSource) => void;
}

type Phase = 'idle' | 'processing' | 'ready';

export default function UploadScreen({ onComplete }: UploadScreenProps) {
  const [mode, setMode] = useState<'document' | 'youtube'>('document');
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processDoc = (name: string, size: string) => {
    setFileName(name);
    setFileSize(size);
    setPhase('processing');
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 18 + 6;
        if (next >= 100) {
          clearInterval(iv);
          setPhase('ready');
          setTimeout(() => {
            onComplete({ type: 'document', name, size });
          }, 700);
          return 100;
        }
        return next;
      });
    }, 180);
  };

  const handleFile = (file: File) => {
    const sizeLabel = file.size > 1024 * 1024
      ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`;
    processDoc(file.name, sizeLabel);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const extractYouTubeId = (value: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:youtube\.com\/embed\/)([\w-]{11})/,
    ];
    for (const p of patterns) {
      const m = value.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const processYouTube = (rawUrl: string) => {
    const id = extractYouTubeId(rawUrl);
    if (!id) {
      setUrlError('Please enter a valid YouTube URL.');
      return;
    }
    setUrlError('');
    setFileName('YouTube Video');
    setPhase('processing');
    setProgress(0);
    const steps = ['Extracting transcript', 'Processing content', 'Preparing chat'];
    let s = 0;
    const iv = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 16 + 8;
        if (next >= 100) {
          clearInterval(iv);
          setPhase('ready');
          setTimeout(() => {
            onComplete({
              type: 'youtube',
              name: `YouTube Video · ${id}`,
              videoId: id,
            });
          }, 700);
          return 100;
        }
        const idx = Math.min(steps.length - 1, Math.floor((next / 100) * steps.length));
        if (idx !== s) s = idx;
        return next;
      });
    }, 220);
  };

  if (phase === 'processing' || phase === 'ready') {
    return <ProcessingView phase={phase} progress={progress} name={fileName} mode={mode} />;
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 py-8 sm:py-10 overflow-y-auto scroll-thin">
      <div className="w-full max-w-2xl scale-in">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black mb-4 sm:mb-5 shadow-lg shadow-black/10">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            Chat with your content
          </h1>
          <p className="mt-3 text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Upload a document or paste a YouTube link. AI will read it and answer any question you ask.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex p-1 bg-gray-100 rounded-xl mb-5 sm:mb-6 w-fit mx-auto border border-gray-200">
          <button
            onClick={() => setMode('document')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
              mode === 'document' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Document
          </button>
          <button
            onClick={() => setMode('youtube')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
              mode === 'youtube' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Youtube className="w-4 h-4" />
            YouTube
          </button>
        </div>

        {mode === 'document' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed bg-gray-50/50 px-6 sm:px-8 py-10 sm:py-14 text-center cursor-pointer transition group ${
              dragging ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white border border-gray-200 mb-4 group-hover:scale-105 transition">
              <Upload className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-base font-semibold text-gray-900">
              Drop your document here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1.5">
              PDF, DOCX, TXT, MD, CSV — up to 20 MB
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 px-6 py-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Paste a YouTube URL
            </label>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setUrlError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && url.trim()) processYouTube(url.trim()); }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition"
              />
            </div>
            {urlError && <p className="text-sm text-red-500 mt-2">{urlError}</p>}
            <button
              onClick={() => processYouTube(url.trim())}
              disabled={!url.trim()}
              className="mt-4 w-full h-11 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition"
            >
              <Youtube className="w-4 h-4" />
              Extract Transcript & Chat
            </button>
            <p className="text-xs text-gray-400 mt-3 text-center">
              We'll pull the transcript so you can ask questions about the video.
            </p>
          </div>
        )}

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-8 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Private & secure</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Instant processing</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> No sign-up needed</span>
        </div>
      </div>
    </div>
  );
}

function ProcessingView({ phase, progress, name, mode }: { phase: Phase; progress: number; name: string; mode: 'document' | 'youtube'; }) {
  const steps = mode === 'document'
    ? ['Reading document', 'Extracting text', 'Indexing content', 'Preparing chat']
    : ['Extracting transcript', 'Processing content', 'Indexing content', 'Preparing chat'];
  const currentStep = Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length));
  const done = phase === 'ready';

  return (
    <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 fade-in">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-50 border border-gray-200 mb-6">
          {done ? (
            <CheckCircle2 className="w-10 h-10 text-black" />
          ) : (
            <Loader2 className="w-10 h-10 text-black animate-spin" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-black mb-1">
          {done ? 'Ready to chat' : 'Processing your content'}
        </h2>
        <p className="text-gray-500 text-sm mb-8 truncate">{name}</p>

        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mb-6">
          <div
            className="h-full bg-black rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-2.5 text-left">
          {steps.map((s, i) => {
            const complete = i < currentStep || done;
            const active = i === currentStep && !done;
            return (
              <div key={s} className="flex items-center gap-3">
                {complete ? (
                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                ) : active ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-gray-200 shrink-0" />
                )}
                <span className={`text-sm ${complete ? 'text-black font-medium' : active ? 'text-gray-700' : 'text-gray-400'}`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
