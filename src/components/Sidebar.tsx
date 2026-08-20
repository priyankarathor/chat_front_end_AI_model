import { useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  Youtube,
  Clock,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import type { ChatSession } from '@/types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  const [query, setQuery] = useState('');

  const docs = sessions.filter((s) => s.source.type === 'document');
  const vids = sessions.filter((s) => s.source.type === 'youtube');
  const recent = [...sessions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  const filtered = query
    ? recent.filter((s) => s.title.toLowerCase().includes(query.toLowerCase()))
    : recent;

  if (collapsed) {
    return (
      <aside className="w-16 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col items-center py-4 gap-3">
        <button
          onClick={onToggleCollapsed}
          className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
          title="Expand sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <button
          onClick={onNewChat}
          className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition"
          title="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="flex-1" />
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 h-16 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-black leading-none">
              AI Chatboard
            </h1>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-none">Document & Video AI</p>
          </div>
        </div>
        <button
          onClick={onToggleCollapsed}
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="w-full h-10 rounded-xl bg-black text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition"
          />
        </div>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto scroll-thin px-3 pt-3 pb-2">
        <NavSection icon={<FileText className="w-4 h-4" />} label="Documents" items={docs} activeSessionId={activeSessionId} onSelect={onSelect} />
        <NavSection icon={<Youtube className="w-4 h-4" />} label="YouTube Videos" items={vids} activeSessionId={activeSessionId} onSelect={onSelect} />

        <div className="mt-4">
          <div className="flex items-center gap-2 px-2 mb-1.5 text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Recent</span>
          </div>
          <div className="space-y-0.5">
            {filtered.length === 0 && (
              <p className="px-2 py-2 text-xs text-gray-400">
                {query ? 'No chats found.' : 'No chats yet.'}
              </p>
            )}
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                  s.id === activeSessionId
                    ? 'bg-black text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-200/70'
                }`}
              >
                {s.source.type === 'youtube' ? (
                  <Youtube className="w-4 h-4 shrink-0 opacity-70" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0 opacity-70" />
                )}
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200/70 transition cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white text-sm font-semibold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-none">Jordan Doe</p>
            <p className="text-xs text-gray-500 mt-1 leading-none">Pro Plan</p>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-gray-300/60 text-gray-500 transition" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  icon,
  label,
  items,
  activeSessionId,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  items: ChatSession[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2 py-1.5 text-gray-500 hover:text-gray-700 transition"
      >
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-[11px] text-gray-400">{items.length}</span>
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                s.id === activeSessionId
                  ? 'bg-black text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-200/70'
              }`}
            >
              {s.source.type === 'youtube' ? (
                <Youtube className="w-4 h-4 shrink-0 opacity-70" />
              ) : (
                <FileText className="w-4 h-4 shrink-0 opacity-70" />
              )}
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
