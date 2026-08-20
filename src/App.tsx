import { useCallback, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UploadScreen from '@/components/UploadScreen';
import ChatWorkspace from '@/components/ChatWorkspace';
import type { ChatMessage, ChatSession, ChatSource } from '@/types';
import { newId, streamResponse, titleFromSource } from '@/lib/ai';
import { useVoiceInput, useSpeech } from '@/lib/voice';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [partialAnswer, setPartialAnswer] = useState('');
  const [view, setView] = useState<'upload' | 'chat'>('upload');

  const cancelRef = useRef<(() => void) | null>(null);
  const lastQuestionRef = useRef<string>('');

  const { listening, interim, start: startListen, stop: stopListen, supported: voiceSupported } = useVoiceInput();
  const { speakingId, speak, stop: stopSpeak } = useSpeech();

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const updateSession = useCallback((id: string, fn: (s: ChatSession) => ChatSession) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? fn(s) : s)));
  }, []);

  const handleUploadComplete = useCallback((source: ChatSource) => {
    const session: ChatSession = {
      id: newId(),
      title: titleFromSource(source),
      source,
      messages: [],
      createdAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    setView('chat');
  }, []);

  const runAI = useCallback(
    (question: string, sessionId: string) => {
      setIsGenerating(true);
      setPartialAnswer('');
      lastQuestionRef.current = question;

      const aiMsg: ChatMessage = {
        id: newId(),
        role: 'ai',
        content: '',
        createdAt: Date.now(),
      };
      // add placeholder AI message
      updateSession(sessionId, (s) => ({
        ...s,
        messages: [...s.messages, aiMsg],
      }));

      cancelRef.current = streamResponse(
        question,
        (partial) => setPartialAnswer(partial),
        (full) => {
          updateSession(sessionId, (s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === aiMsg.id ? { ...m, content: full } : m,
            ),
          }));
          setIsGenerating(false);
          setPartialAnswer('');
          cancelRef.current = null;
        },
      );
    },
    [updateSession],
  );

  const handleSend = useCallback(
    (text: string) => {
      if (!activeId) return;
      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      };
      updateSession(activeId, (s) => ({
        ...s,
        messages: [...s.messages, userMsg],
      }));
      runAI(text, activeId);
    },
    [activeId, updateSession, runAI],
  );

  const handleRegenerate = useCallback(() => {
    if (!activeId || !lastQuestionRef.current || isGenerating) return;
    // remove last AI message
    updateSession(activeId, (s) => {
      const msgs = [...s.messages];
      if (msgs.length && msgs[msgs.length - 1].role === 'ai') msgs.pop();
      return { ...s, messages: msgs };
    });
    runAI(lastQuestionRef.current, activeId);
  }, [activeId, isGenerating, updateSession, runAI]);

  const handleNewChat = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsGenerating(false);
    setPartialAnswer('');
    setActiveId(null);
    setView('upload');
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      setIsGenerating(false);
      setPartialAnswer('');
      setActiveId(id);
      setView('chat');
    },
    [],
  );

  const handleAttach = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsGenerating(false);
    setPartialAnswer('');
    setActiveId(null);
    setView('upload');
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
  }, []);

  const handleToggleListen = useCallback(() => {
    if (!voiceSupported) return;
    if (listening) {
      stopListen();
    } else {
      startListen((text) => {
        if (activeId && text) handleSend(text);
      });
    }
  }, [voiceSupported, listening, stopListen, startListen, activeId, handleSend]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {view === 'chat' && activeSession ? (
          <ChatWorkspace
            source={activeSession.source}
            messages={activeSession.messages}
            isGenerating={isGenerating}
            partialAnswer={partialAnswer}
            onSend={handleSend}
            onRegenerate={handleRegenerate}
            onAttach={handleAttach}
            onCopy={handleCopy}
            onSpeak={speak}
            onStopSpeaking={stopSpeak}
            speakingId={speakingId}
            listening={listening}
            onToggleListen={handleToggleListen}
            interimTranscript={interim}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        ) : (
          <UploadScreen onComplete={handleUploadComplete} />
        )}
      </main>
    </div>
  );
}
