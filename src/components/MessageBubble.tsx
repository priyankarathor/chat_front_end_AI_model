import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Volume2, Square } from 'lucide-react';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  onRegenerate: () => void;
  onCopy: (text: string) => void;
  onSpeak: (text: string, id: string) => void;
  speakingId: string | null;
  onStopSpeaking: () => void;
}

export default function MessageBubble({
  message,
  isLast,
  onRegenerate,
  onCopy,
  onSpeak,
  speakingId,
  onStopSpeaking,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isSpeaking = speakingId === message.id;

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="flex justify-end msg-in">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-black text-white px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 msg-in">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap shadow-sm">
          {message.content}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-1 mt-1.5 ml-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition"
            title="Copy answer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          {isLast && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition"
              title="Regenerate"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          )}

          {isSpeaking ? (
            <button
              onClick={onStopSpeaking}
              className="flex items-center gap-1 text-xs text-black px-2 py-1 rounded-md hover:bg-gray-100 transition"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
              Stop
            </button>
          ) : (
            <button
              onClick={() => onSpeak(message.content, message.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition"
              title="Read aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Listen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
