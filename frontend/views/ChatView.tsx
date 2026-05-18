import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare, Send, X, ArrowLeft, Search, Circle,
  User as UserIcon, Loader2, Check, CheckCheck
} from 'lucide-react';

const API = 'http://localhost:5000/api';

interface ChatViewProps {
  user: any;
  isDark?: boolean;
  targetUser?: any; // Si fourni, ouvre directement cette conversation
  onClose?: () => void;
  isModal?: boolean;
}

interface MessageItem {
  _id: string;
  senderId: { _id: string; name: string; role: string; avatarColor?: string };
  receiverId: { _id: string; name: string };
  text: string;
  isRead: boolean;
  createdAt: string;
}

interface ConversationItem {
  contact: { _id: string; name: string; role: string; company?: string; avatarColor?: string };
  lastMessage: { text: string; createdAt: string; senderId: string };
  unreadCount: number;
}

const ChatView: React.FC<ChatViewProps> = ({ user, isDark = true, targetUser, onClose, isModal = false }) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(targetUser || null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const myId = user?._id || user?.id;
  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // ── Charger la liste des conversations ──
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/messages/conversations`, { headers });
      if (res.ok) setConversations(await res.json());
    } catch (e) { console.error('[Chat] Load conversations error:', e); }
  }, []);

  // ── Charger les messages d'une conversation ──
  const loadMessages = useCallback(async (contactId: string) => {
    try {
      const res = await fetch(`${API}/messages/conversation/${contactId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) { console.error('[Chat] Load messages error:', e); }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadConversations();
      if (targetUser) {
        const id = targetUser._id || targetUser.id;
        setSelectedContact(targetUser);
        loadMessages(id);
      } else if (user?.role === 'CLIENT') {
        // Auto-sélectionner la première conversation (l'auditeur assigné)
        try {
          const res = await fetch(`${API}/messages/conversations`, { headers });
          if (res.ok) {
            const convos = await res.json();
            setConversations(convos);
            if (convos.length > 0 && convos[0].contact) {
              setSelectedContact(convos[0].contact);
              const id = convos[0].contact._id || convos[0].contact.id;
              loadMessages(id);
            }
          }
        } catch (e) { console.error('[Chat] Auto-select error:', e); }
      }
    };
    init();
  }, []);

  // Polling toutes les 4s
  useEffect(() => {
    if (!selectedContact) return;
    const contactId = selectedContact._id || selectedContact.id;
    pollingRef.current = setInterval(() => {
      loadMessages(contactId);
      loadConversations();
    }, 4000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [selectedContact]);

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    const id = contact._id || contact.id;
    loadMessages(id);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedContact) return;
    setSending(true);
    try {
      const contactId = selectedContact._id || selectedContact.id;
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ receiverId: contactId, text: newMsg.trim() }),
      });
      if (res.ok) {
        setNewMsg('');
        await loadMessages(contactId);
        loadConversations();
      }
    } catch (e) { console.error('[Chat] Send error:', e); }
    finally { setSending(false); }
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const filteredConvos = conversations.filter(c =>
    c.contact?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '??';

  const content = (
    <div className={`flex h-full ${isDark ? 'bg-[#0a0c14]' : 'bg-slate-50'} rounded-[32px] overflow-hidden border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
      
      {/* ═══ SIDEBAR — Liste conversations ═══ */}
        <div className={`w-[340px] shrink-0 flex flex-col ${isDark ? 'bg-slate-900/50 border-r border-slate-800' : 'bg-white border-r border-slate-200'}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-black uppercase italic tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <MessageSquare size={20} className="inline mr-2 text-[#57a9d9]" />Messages
            </h2>
            {isModal && onClose && (
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-all"><X size={20} /></button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text" placeholder="Rechercher..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs font-bold outline-none ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-100 border border-slate-200 text-slate-900'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {filteredConvos.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs font-bold">Aucune conversation</p>
            </div>
          ) : filteredConvos.map(c => (
            <button
              key={c.contact?._id}
              onClick={() => handleSelectContact(c.contact)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all ${
                (selectedContact?._id || selectedContact?.id) === c.contact?._id
                  ? (isDark ? 'bg-[#57a9d9]/15 border border-[#57a9d9]/30' : 'bg-[#57a9d9]/10 border border-[#57a9d9]/20')
                  : (isDark ? 'hover:bg-white/5 border border-transparent' : 'hover:bg-slate-100 border border-transparent')
              }`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ backgroundColor: c.contact?.avatarColor || '#57a9d9' }}>
                {initials(c.contact?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.contact?.name}</span>
                  <span className="text-[9px] text-slate-500 shrink-0">{formatDate(c.lastMessage?.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {c.lastMessage?.text?.substring(0, 35)}{(c.lastMessage?.text?.length || 0) > 35 ? '...' : ''}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="bg-[#57a9d9] text-white text-[9px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>


      {/* ═══ ZONE CHAT ═══ */}
      <div className="flex-1 flex flex-col">
        {!selectedContact ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare size={64} className="mx-auto text-slate-700 opacity-20" />
              <p className={`text-lg font-black uppercase italic tracking-tighter ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Sélectionnez une conversation
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header contact */}
            <div className={`px-8 py-5 flex items-center gap-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'}`}>
              <button onClick={() => {
                if (user?.role !== 'CLIENT') setSelectedContact(null);
                if (onClose) onClose();
              }} className="text-slate-400 hover:text-[#57a9d9] transition-all lg:hidden">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black"
                style={{ backgroundColor: selectedContact?.avatarColor || '#57a9d9' }}>
                {initials(selectedContact?.name)}
              </div>
              <div>
                <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedContact?.name}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {selectedContact?.role === 'AUDITOR' ? 'Auditeur' : selectedContact?.role === 'CLIENT' ? 'Client' : selectedContact?.role}
                  {selectedContact?.company ? ` • ${selectedContact.company}` : ''}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-3">
              {messages.map(msg => {
                const isMine = (msg.senderId?._id || msg.senderId) === myId;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-5 py-3 rounded-3xl ${
                      isMine
                        ? 'bg-[#57a9d9] text-white rounded-br-lg'
                        : (isDark ? 'bg-slate-800 text-slate-200 rounded-bl-lg' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-lg')
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`flex items-center justify-end gap-1.5 mt-1 ${isMine ? 'text-white/60' : 'text-slate-500'}`}>
                        <span className="text-[9px] font-bold">{formatTime(msg.createdAt)}</span>
                        {isMine && (msg.isRead ? <CheckCheck size={12} /> : <Check size={12} />)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className={`px-6 py-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex gap-3`}>
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Écrivez votre message..."
                className={`flex-1 px-6 py-4 rounded-2xl text-sm font-medium outline-none ${
                  isDark ? 'bg-white/5 border border-white/10 text-white placeholder:text-slate-600' : 'bg-slate-100 border border-slate-200 text-slate-900'
                }`}
              />
              <button
                type="submit"
                disabled={!newMsg.trim() || sending}
                className="px-6 py-4 bg-[#57a9d9] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" style={{ zIndex: 9999 }}>
        <div className="w-full max-w-5xl h-[80vh] animate-in zoom-in-95 duration-300">
          {content}
        </div>
      </div>,
      document.body
    );
  }

  return <div className="h-[calc(100vh-200px)]">{content}</div>;
};

export default ChatView;
