import { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UploadScreen from '@/components/UploadScreen';
import ChatWorkspace from '@/components/ChatWorkspace';
import type { ChatMessage, ChatSession, ChatSource } from '@/types';
import { newId, titleFromSource } from '@/lib/ai';
import { askDocument } from '@/lib/api';
import type { ApiAuth } from '@/lib/api';
import { loginUser, registerUser, type AuthSession } from '@/api/auth';
import { useVoiceInput, useSpeech } from '@/lib/voice';
import Login from '@/Authentication/login';
import Register from '@/Authentication/register';

const SESSION_KEY = 'reader-ai-session';

export default function App() {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        setUser(JSON.parse(savedSession) as AuthSession);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setAuthLoading(false);
  }, []);

  const authenticate = async (
    action: 'login' | 'register',
    email: string,
    password: string,
    name?: string,
  ) => {
    setAuthError(null);
    setAuthNotice(null);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (action === 'register') {
        const response = await registerUser({ name: name?.trim(), email: normalizedEmail, password });
        setAuthView('login');
        setAuthNotice(response.message ?? 'Account created. Please login.');
        return;
      }

      const session = await loginUser({ email: normalizedEmail, password });
      const sessionWithEmail = { ...session, email: session.email ?? normalizedEmail };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionWithEmail));
      setUser(sessionWithEmail);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in.');
    }
  };

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
    async (question: string, sessionId: string) => {
      setIsGenerating(true);
      setPartialAnswer('');
      lastQuestionRef.current = question;
      const controller = new AbortController();

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

      cancelRef.current = () => controller.abort();

      try {
        if (!user) {
          throw new Error('Please sign in again before asking a question.');
        }

        const auth: ApiAuth = {
          accessToken: user.accessToken,
          userId: user.userId,
        };
        const answer = await askDocument(question, auth, controller.signal);
        updateSession(sessionId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === aiMsg.id ? { ...m, content: answer } : m,
          ),
        }));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Unable to get an answer from the server.';
        updateSession(sessionId, (s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === aiMsg.id
              ? { ...m, content: `Sorry, I could not get an answer: ${message}` }
              : m,
          ),
        }));
      } finally {
        if (!controller.signal.aborted) {
          setIsGenerating(false);
          setPartialAnswer('');
          cancelRef.current = null;
        }
      }
    },
    [updateSession, user],
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

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f5f5f2] text-sm text-gray-500">Loading...</div>;
  if (!user) return authView === 'login'
    ? <Login onLogin={(email, password) => authenticate('login', email, password)} onSwitchToRegister={() => { setAuthError(null); setAuthNotice(null); setAuthView('register'); }} error={authError} notice={authNotice} />
    : <Register onRegister={(name, email, password) => authenticate('register', email, password, name)} onSwitchToLogin={() => { setAuthError(null); setAuthNotice(null); setAuthView('login'); }} error={authError} />;

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
          <UploadScreen
            auth={{
              accessToken: user.accessToken,
              userId: user.userId,
            }}
            onComplete={handleUploadComplete}
          />
        )}
        <button onClick={() => { localStorage.removeItem(SESSION_KEY); setUser(null); }} className="absolute right-4 top-4 z-10 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-gray-200 hover:text-black">Sign out</button>
      </main>
    </div>
  );
}
