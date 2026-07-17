import React, { useState, useRef, useEffect } from 'react';
import { Mission } from '../types';
import { ShieldAlert, Send, Sparkles, User, RefreshCw } from 'lucide-react';

interface MentorTabProps {
  activeMission: Mission | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MentorTab({ activeMission }: MentorTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu Mentor IA de Cibersegurança. Posso te ajudar a entender conceitos de hacking ético, arquitetura de rede segura ou dar dicas sutis para resolver as missões ativas. O que gostaria de explorar hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text) return;

    if (!textToSend) setInput('');

    const newMessages = [...messages, { role: 'user', content: text } as Message];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          activeMission,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta do Mentor IA.');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Desculpe, não consegui processar sua dúvida agora. Detalhe técnico: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presetQuestions = [
    'O que é OWASP Top 10?',
    'Como evitar SQL Injection na prática?',
    'Quais as melhores práticas para regras de iptables?',
    'Explique o conceito de Pivoting em redes.',
  ];

  return (
    <div id="mentor-chat-container" className="flex flex-col h-full bg-[#080808] border border-[#1a1a1a] rounded-xl overflow-hidden font-sans">
      {/* Mentor Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="flex items-center space-x-2">
          <div className="bg-cyan-950/30 p-1.5 rounded-lg border border-cyan-900/30">
            <ShieldAlert size={14} className="text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-200 block uppercase font-mono tracking-tight">MENTOR_AI_INTEL</span>
            <span className="text-[10px] text-[#666] font-mono tracking-tight">Pronto para tirar dúvidas e guiar seus estudos</span>
          </div>
        </div>
        <button
          id="clear-mentor-chat"
          onClick={() => setMessages([messages[0]])}
          className="text-[10px] text-[#666] hover:text-[#fff] font-mono transition"
        >
          LIMPAR_HISTORICO
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[350px] md:max-h-none min-h-[220px]">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div className={`p-1.5 rounded-lg border ${
              msg.role === 'user'
                ? 'bg-[#111] border-[#222] text-cyan-400'
                : 'bg-cyan-950/20 border-cyan-900/30 text-cyan-400'
            }`}>
              {msg.role === 'user' ? <User size={12} /> : <Sparkles size={12} />}
            </div>

            {/* Bubble */}
            <div className={`p-3 rounded-xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#111] text-zinc-200 border border-[#222] rounded-tr-none'
                : 'bg-[#0a0a0a] text-[#999] border border-[#1a1a1a] rounded-tl-none'
            }`}>
              <div className="whitespace-pre-line prose prose-invert prose-xs">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-cyan-400 text-xs animate-pulse font-mono">
            <RefreshCw size={12} className="animate-spin text-cyan-500" />
            <span>Mentor IA pensando em uma resposta estruturada...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset templates */}
      {messages.length === 1 && (
        <div className="px-4 py-3 border-t border-[#1a1a1a]/60 bg-[#050505]">
          <span className="text-[9px] text-[#666] block mb-2 uppercase font-mono tracking-wider font-bold">
            Dúvidas Frequentes de Alunos:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="bg-[#111] hover:bg-[#161616] border border-[#222] hover:border-cyan-500/40 text-[#888] hover:text-white text-[10px] px-2.5 py-1.5 rounded transition cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2.5 border-t border-[#1a1a1a] bg-[#050505] flex space-x-2"
      >
        <input
          id="mentor-message-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tire dúvidas ou peça dicas sobre a missão..."
          disabled={loading}
          className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-[#444] disabled:opacity-50"
        />
        <button
          id="mentor-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 p-1.5 rounded transition cursor-pointer flex items-center justify-center"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
