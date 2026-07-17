import React, { useState } from 'react';
import { Mission } from '../types';
import { Sparkles, Loader2, HelpCircle, AlertCircle } from 'lucide-react';

interface CustomScenarioCreatorProps {
  onScenarioGenerated: (mission: Mission) => void;
}

export default function CustomScenarioCreator({ onScenarioGenerated }: CustomScenarioCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: prompt }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar o desafio personalizado com IA.');
      }

      const missionData = await response.json();
      if (!missionData.title || !missionData.steps) {
        throw new Error('Formato do desafio retornado pela IA é inválido.');
      }

      onScenarioGenerated(missionData);
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro inesperado na geração do cenário.');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Invasão de um servidor IoT inteligente doméstico vulnerável.',
    'Ataque Man-in-the-Middle (MITM) na rede de um escritório.',
    'Mitigação de ataque de força bruta em um servidor de email corporativo.',
    'Identificação de backdoor escondido em um script PHP legado.',
  ];

  return (
    <div id="scenario-generator" className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-4 font-sans shadow-lg">
      <div className="flex items-center space-x-2 mb-2.5">
        <div className="bg-cyan-950/30 p-1.5 rounded-lg border border-cyan-900/30">
          <Sparkles className="text-cyan-400 animate-pulse" size={14} />
        </div>
        <div>
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">GERAR CENÁRIO COM IA</h3>
          <p className="text-[9.5px] text-[#555] font-mono">Crie simulações de rede personalizadas em segundos</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
          <Loader2 className="animate-spin text-cyan-500" size={24} />
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-cyan-400 font-mono animate-pulse uppercase">
              CONSTRUINDO REDE VIRTUAL...
            </span>
            <p className="text-[9px] text-[#555] max-w-xs leading-relaxed font-mono">
              Escrevendo briefing, portas, vulnerabilidades e objetivos.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-400 block font-bold uppercase tracking-tight">
              O que você deseja estudar?
            </label>
            <textarea
              id="custom-scenario-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Servidor Apache com exploit RCE para obter privilégios de root..."
              className="w-full bg-[#0a0a0a] border border-[#1a1a1a] focus:border-cyan-500/80 text-xs text-white rounded-lg p-2.5 h-12 min-h-[48px] max-h-[100px] focus:outline-none placeholder-[#444] leading-normal font-mono transition-all resize-y"
            />
          </div>

          {error && (
            <div className="flex items-start gap-1.5 p-2 bg-rose-950/10 border border-rose-900/30 rounded-lg text-[10px] text-rose-400">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              id="generate-scenario-btn"
              type="submit"
              disabled={!prompt.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[10px] font-mono font-bold px-3 py-1.5 rounded transition-all shadow-[0_0_12px_rgba(8,145,178,0.3)] cursor-pointer flex items-center gap-1"
            >
              <Sparkles size={11} />
              Criar Desafio IA
            </button>
          </div>

          {/* Prompt Suggestions */}
          <div className="pt-2 border-t border-[#1a1a1a]">
            <span className="text-[9px] text-[#555] block mb-1.5 uppercase font-mono tracking-wider font-bold flex items-center gap-1">
              <HelpCircle size={11} /> Sugestões rápidas:
            </span>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((sug, idx) => {
                const shortText = sug.length > 40 ? sug.slice(0, 38) + '...' : sug;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sug)}
                    title={sug}
                    className="bg-[#0c0c0c] hover:bg-[#161616] hover:text-zinc-200 border border-[#1a1a1a] text-[#777] text-[9.5px] px-2 py-0.5 rounded transition text-left cursor-pointer font-mono whitespace-normal max-w-[210px] truncate"
                  >
                    {shortText}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
