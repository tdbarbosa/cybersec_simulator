import React, { useState, useRef, useEffect } from 'react';
import { Mission, TerminalLine, NetworkNode, MissionStep } from '../types';
import { Terminal as TerminalIcon, Send, HelpCircle, RefreshCw, Sparkles, BookOpen } from 'lucide-react';

interface TerminalProps {
  mission: Mission;
  steps: MissionStep[];
  nodes: NetworkNode[];
  onStepComplete: (stepId: number) => void;
  onUpdateNodes: (nodes: NetworkNode[]) => void;
  terminalLines: TerminalLine[];
  setTerminalLines: React.Dispatch<React.SetStateAction<TerminalLine[]>>;
}

export default function Terminal({
  mission,
  steps,
  nodes,
  onStepComplete,
  onUpdateNodes,
  terminalLines,
  setTerminalLines,
}: TerminalProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [heightMode, setHeightMode] = useState<'small' | 'medium' | 'large'>('medium');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final do terminal sempre que houver novas saídas
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const addLine = (text: string, type: TerminalLine['type']) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLines((prev) => [...prev, { text, type, timestamp }]);
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = input.trim();
    if (!command) return;

    // Adiciona o comando digitado ao histórico do terminal
    addLine(`root@cybersec-lab:~# ${command}`, 'input');
    setInput('');

    // Comandos de controle local simples para uma experiência fluida
    const lowerCmd = command.toLowerCase();

    if (lowerCmd === 'clear') {
      setTerminalLines([]);
      return;
    }

    if (lowerCmd === 'help') {
      addLine('----------------------------------------------------', 'info');
      addLine('CyberShield AI CLI - Sistema de Treinamento Virtual', 'success');
      addLine('----------------------------------------------------', 'info');
      addLine('Comandos Locais Disponíveis:', 'info');
      addLine('  help      - Mostra esta tela de ajuda técnica.', 'info');
      addLine('  clear     - Limpa o histórico de saídas do terminal.', 'info');
      addLine('  status    - Exibe o status consolidado de segurança da infraestrutura.', 'info');
      addLine('  hint      - Solicita uma dica da Inteligência Artificial para o passo atual.', 'info');
      addLine('Ferramentas de Pentest & Defesa Integradas (Simuladas por IA):', 'success');
      addLine('  nmap <IP>          - Mapeador de portas e vulnerabilidades em redes.', 'info');
      addLine('  sqlmap -u "<URL>"  - Utilitário de testes de SQL Injection.', 'info');
      addLine('  ssh <user>@<IP>    - Estabelece conexão segura de terminal remoto.', 'info');
      addLine('  iptables <regras>  - Configura regras de filtragem de pacotes no gateway.', 'info');
      addLine('  netstat            - Lista portas e conexões de rede ativas em tempo real.', 'info');
      addLine('Nota: Você pode digitar QUALQUER comando livre ou interagir diretamente. A IA simulará a resposta!', 'ai');
      return;
    }

    if (lowerCmd === 'status') {
      addLine('--- STATUS ATUAL DOS ATIVOS DE REDE ---', 'info');
      nodes.forEach((node) => {
        const nodeStatus = node.status === 'secure' ? '🟢 SEGURO' :
                           node.status === 'compromised' ? '🔴 COMPROMETIDO (HACKEADO)' :
                           node.status === 'scanned' ? '🔵 ESCANEADO/AVALIADO' : '⚪ DESCONECTADO';
        addLine(`Nó: ${node.label} (${node.ip}) | Status: ${nodeStatus} | S.O: ${node.os}`, 'info');
      });
      return;
    }

    if (lowerCmd === 'hint') {
      const activeStep = steps.find((s) => !s.isCompleted);
      if (activeStep) {
        addLine(`💡 DICA DA IA PARA O PASSO "${activeStep.title}":`, 'ai');
        addLine(`   ${activeStep.hint}`, 'info');
      } else {
        addLine('🎉 Todos os passos desta missão foram completados com sucesso!', 'success');
      }
      return;
    }

    // Para outros comandos, consultamos o simulador Gemini no backend
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          mission,
          steps,
          nodes,
          history: terminalLines.map((l) => `${l.type === 'input' ? 'IN' : 'OUT'}: ${l.text}`),
        }),
      });

      if (!response.ok) {
        throw new Error('Falha no simulador de terminal de IA.');
      }

      const data = await response.json();

      // Escreve a saída retornada pela IA
      if (data.output) {
        addLine(data.output, 'output');
      }

      // Se houver passos marcados como completos, atualiza no estado pai
      if (data.stepCompletedId) {
        onStepComplete(data.stepCompletedId);
        const compStep = steps.find(s => s.id === data.stepCompletedId);
        if (compStep) {
          addLine(`✨ OBJETIVO CONCLUÍDO: ${compStep.title}`, 'success');
        }
      } else {
        // Fallback rápido de trigger local caso a IA responda vagamente
        const activeStep = steps.find((s) => !s.isCompleted);
        if (activeStep && activeStep.triggerCommand) {
          const matchedTrigger = command.toLowerCase().includes(activeStep.triggerCommand.toLowerCase());
          if (matchedTrigger) {
            onStepComplete(activeStep.id);
            addLine(`✨ OBJETIVO CONCLUÍDO: ${activeStep.title}`, 'success');
          }
        }
      }

      // Se houver nós atualizados, reflete na topologia visual
      if (data.updatedNodes && data.updatedNodes.length > 0) {
        onUpdateNodes(data.updatedNodes);
      }
    } catch (err: any) {
      addLine(`⚠️ [IA Offline]: Erro de conexão com o cérebro artificial: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const heightClasses = {
    small: 'h-[240px]',
    medium: 'h-[360px]',
    large: 'h-[500px]',
  };

  return (
    <div
      id="interactive-terminal"
      className={`flex flex-col ${heightClasses[heightMode]} bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl transition-all duration-300`}
    >
      {/* Header do Terminal */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0a] border-b border-[#1a1a1a]">
        <div className="flex items-center space-x-2">
          <TerminalIcon size={13} className="text-cyan-500" />
          <span className="text-[10px] font-mono font-bold tracking-tight text-[#c0c0c0] flex items-center gap-1">
            TERMINAL — <span className="text-cyan-500 font-bold">user@cyber-sim</span>
          </span>
        </div>
        
        <div className="flex items-center space-x-3.5">
          {/* Altura de Terminal (Opção de Escalonamento) */}
          <div className="flex items-center bg-[#111] border border-[#222] rounded p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setHeightMode('small')}
              className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                heightMode === 'small'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title="Altura Pequena (240px)"
            >
              P
            </button>
            <button
              type="button"
              onClick={() => setHeightMode('medium')}
              className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                heightMode === 'medium'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title="Altura Média (360px)"
            >
              M
            </button>
            <button
              type="button"
              onClick={() => setHeightMode('large')}
              className={`text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                heightMode === 'large'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
              title="Altura Grande (500px)"
            >
              G
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500/40"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/40"></span>
          </div>
        </div>
      </div>

      {/* Conteúdo do Console */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-[#a0a0a0] space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {terminalLines.length === 0 && (
          <div className="text-[#666] text-center py-6 text-[11px]">
            <Sparkles size={16} className="mx-auto text-[#444] mb-1" />
            Terminal de rede inicializado. Digite <span className="text-cyan-500">help</span> para listar comandos úteis.
            <br />
            Insira nmap ou comandos interativos para interagir com o ambiente simulado por IA.
          </div>
        )}
        
        {terminalLines.map((line, idx) => {
          let lineClass = 'text-[#ccc]';
          if (line.type === 'input') lineClass = 'text-white font-semibold';
          if (line.type === 'success') lineClass = 'text-green-500 font-bold';
          if (line.type === 'error') lineClass = 'text-rose-500';
          if (line.type === 'info') lineClass = 'text-cyan-400';
          if (line.type === 'ai') lineClass = 'text-cyan-400 bg-cyan-950/20 px-2 py-1 rounded border border-cyan-900/30';

          return (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed">
              <span className="text-[9px] text-[#444] select-none mr-2">[{line.timestamp}]</span>
              <span className={lineClass}>{line.text}</span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-cyan-400 animate-pulse py-1">
            <RefreshCw size={12} className="animate-spin text-cyan-500" />
            <span className="text-[10px] tracking-widest font-bold">SIMULADOR IA PROCESSANDO COMANDO...</span>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Input de Comando */}
      <form onSubmit={handleCommandSubmit} className="flex items-center border-t border-[#1a1a1a] bg-[#050505] px-3.5 py-2.5">
        <span className="text-cyan-500 font-mono text-xs font-bold mr-1.5 select-none">$</span>
        <input
          id="terminal-cmd-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="nmap -v 192.168.1.12..."
          disabled={loading}
          className="flex-1 bg-transparent border-none text-white focus:outline-none focus:ring-0 font-mono text-xs placeholder-[#444] disabled:opacity-50"
        />
        <button
          id="terminal-submit-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="text-cyan-600 hover:text-cyan-400 disabled:opacity-40 disabled:hover:text-cyan-600 cursor-pointer transition-colors px-1"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
