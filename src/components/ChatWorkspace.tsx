import { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Youtube,
  MoreHorizontal,
  Paperclip,
  Mic,
  Send,
  Sparkles,
  Square,
  Menu,
} from 'lucide-react';
import type { ChatMessage, ChatSource } from '@/types';
import { SUGGESTED_QUESTIONS } from '@/types';
import MessageBubble from './MessageBubble';

interface ChatWorkspaceProps {
  source: ChatSource;
  messages: ChatMessage[];
  isGenerating: boolean;
  partialAnswer: string;
  onSend: (text: string) => void;
  onRegenerate: () => void;
  onAttach: () => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string, id: string) => void;
  onStopSpeaking: () => void;
  speakingId: string | null;
  listening: boolean;
  onToggleListen: () => void;
  interimTranscript: string;
  onOpenMobileSidebar: () => void;
}

export default function ChatWorkspace({
  source,
  messages,
  isGenerating,
  partialAnswer,
  onSend,
  onRegenerate,
  onAttach,
  onCopy,
  onSpeak,
  onStopSpeaking,
  speakingId,
  listening,
  onToggleListen,
  interimTranscript,
  onOpenMobileSidebar,
}: ChatWorkspaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = messages.length === 0 && !isGenerating;
  const isYoutube = source.type === 'youtube';

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isGenerating, partialAnswer]);

  useEffect(() => {
    if (listening) inputRef.current?.focus();
  }, [listening]);

  const submit = () => {
    const text = input.trim();
    if (!text || isGenerating) return;
    onSend(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const placeholder = isYoutube
    ? 'Ask anything about this video...'
    : 'Ask anything about this document...';

  const displayedInput = listening && interimTranscript ? interimTranscript : input;

  return (
    <div className="flex-1 flex flex-col h-full bg-white slide-in">
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-gray-200 px-3 sm:px-5 flex items-center gap-2 sm:gap-3 bg-white">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition shrink-0"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
          {isYoutube ? (
            <Youtube className="w-4.5 h-4.5 text-gray-700" />
          ) : (
            <FileText className="w-4.5 h-4.5 text-gray-700" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate leading-none">
            {source.name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500 leading-none">Ready to chat</span>
          </div>
        </div>
        <span className="hidden sm:inline px-2.5 py-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-700 border border-gray-200">
          {isYoutube ? 'YouTube' : 'Document'}
        </span>
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition shrink-0" title="More options">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 py-4 sm:py-6">
          {isEmpty ? (
            <EmptyState source={source} onPick={(q) => onSend(q)} />
          ) : (
            <div className="space-y-5">
              {messages.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isLast={i === messages.length - 1 && !isGenerating}
                  onRegenerate={onRegenerate}
                  onCopy={onCopy}
                  onSpeak={onSpeak}
                  onStopSpeaking={onStopSpeaking}
                  speakingId={speakingId}
                />
              ))}

              {isGenerating && (
                <div className="flex gap-3 msg-in">
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {partialAnswer ? (
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap shadow-sm">
                        <span className="cursor-blink">{partialAnswer}</span>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-4 shadow-sm inline-flex items-center gap-1.5">
                        <span className="typing-dot w-2 h-2 rounded-full bg-gray-400" />
                        <span className="typing-dot w-2 h-2 rounded-full bg-gray-400" />
                        <span className="typing-dot w-2 h-2 rounded-full bg-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 sm:px-5 pb-3 sm:pb-5 pt-1 bg-white">
        <div className="max-w-3xl mx-auto">
          <div
            className={`flex items-end gap-2 rounded-2xl border bg-white px-3 py-2.5 shadow-sm transition ${
              listening ? 'border-black ring-2 ring-black/10' : 'border-gray-200 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-black/5'
            }`}
          >
            <button
              onClick={onAttach}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition shrink-0"
              title="Attach another document"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={inputRef}
              value={displayedInput}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none py-2 max-h-32 min-h-[24px]"
              style={{ height: 'auto' }}
            />

            <button
              onClick={onToggleListen}
              className={`p-2 rounded-lg transition shrink-0 ${
                listening
                  ? 'bg-black text-white voice-pulse'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              title={listening ? 'Stop voice input' : 'Voice input'}
            >
              {listening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={submit}
              disabled={!input.trim() || isGenerating}
              className="p-2.5 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition shrink-0"
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ source, onPick }: { source: ChatSource; onPick: (q: string) => void }) {
  const isYoutube = source.type === 'youtube';
  return (
    <div className="flex flex-col items-center text-center pt-10 pb-6 fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 mb-5">
        {isYoutube ? (
          <Youtube className="w-8 h-8 text-gray-700" />
        ) : (
          <FileText className="w-8 h-8 text-gray-700" />
        )}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-black mb-2">
        {isYoutube ? 'Your video is ready.' : 'Your document is ready.'}
      </h2>
      <p className="text-gray-500 max-w-md mb-6 sm:mb-7 text-sm sm:text-base">
        {isYoutube
          ? 'Ask anything about the content, and AI will find answers from the video transcript.'
          : 'Ask anything about the content, and AI will find answers from your uploaded document.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl px-1">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm active:scale-[0.99] transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
