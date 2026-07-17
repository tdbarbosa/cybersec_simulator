import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Terminal as TerminalIcon,
  Code,
  BookOpen,
  Sparkles,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Activity,
  Award,
  Flame,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { Mission, NetworkNode, MissionStep, TerminalLine } from './types';
import { DEFAULT_MISSIONS } from './data/missions';
import NetworkMap from './components/NetworkMap';
import Terminal from './components/Terminal';
import PatchEditor from './components/PatchEditor';
import MentorTab from './components/MentorTab';
import CustomScenarioCreator from './components/CustomScenarioCreator';

export default function App() {
  const [missions, setMissions] = useState<Mission[]>(DEFAULT_MISSIONS);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [activeTab, setActiveTab] = useState<'terminal' | 'editor' | 'mentor'>('terminal');
  const [steps, setSteps] = useState<MissionStep[]>([]);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(new Set());
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);

  // Carrega e inicializa uma missão ativa no Workspace
  const handleStartMission = (mission: Mission) => {
    setActiveMission(mission);
    setSteps(mission.steps.map((s) => ({ ...s, isCompleted: false })));
    setNodes(mission.networkNodes.map((n) => ({ ...n })));
    setSelectedNode(mission.networkNodes[0] || null);
    setTerminalLines([]);
    setActiveTab('terminal');

    // Linhas iniciais de boas-vindas no terminal para cada cenário específico
    const welcomeLines: TerminalLine[] = [
      { text: `--- CYBER LAB SIMULATOR v2.4 (IA BOOTSTRAPPED) ---`, type: 'info', timestamp: new Date().toLocaleTimeString() },
      { text: `Iniciando conexões seguras para o cenário: ${mission.title}...`, type: 'info', timestamp: new Date().toLocaleTimeString() },
      { text: `Para obter dicas sobre as tarefas, digite 'hint' ou use o painel de objetivos ao lado.`, type: 'ai', timestamp: new Date().toLocaleTimeString() },
      { text: `Digite 'help' para listar comandos padrão integrados.`, type: 'success', timestamp: new Date().toLocaleTimeString() },
    ];
    setTerminalLines(welcomeLines);
  };

  const handleStepComplete = (stepId: number) => {
    setSteps((prevSteps) => {
      const updated = prevSteps.map((s) => (s.id === stepId ? { ...s, isCompleted: true } : s));
      
      // Se todos os passos estão marcados como concluídos, marca a missão inteira como ganha!
      const allDone = updated.every((s) => s.isCompleted);
      if (allDone && activeMission) {
        setCompletedMissionIds((prev) => {
          const next = new Set(prev);
          next.add(activeMission.id);
          return next;
        });
      }
      return updated;
    });
  };

  const handleUpdateNodes = (updatedNodes: NetworkNode[]) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const match = updatedNodes.find((un) => un.id === node.id);
        return match ? { ...node, ...match } : node;
      })
    );
    // Atualiza também o nó selecionado atualmente na gaveta
    if (selectedNode) {
      const match = updatedNodes.find((un) => un.id === selectedNode.id);
      if (match) setSelectedNode((prev) => prev ? { ...prev, ...match } : null);
    }
  };

  const handleUpdateNodeStatus = (nodeId: string, status: NetworkNode['status']) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, status } : node))
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => prev ? { ...prev, status } : null);
    }
  };

  // Adiciona um cenário customizado recém-gerado com IA no topo da lista e inicia imediatamente
  const handleCustomScenarioGenerated = (newMission: Mission) => {
    setMissions((prev) => [newMission, ...prev]);
    handleStartMission(newMission);
  };

  // Estatísticas para gamificação do aprendizado
  const totalMissions = missions.length;
  const completedCount = completedMissionIds.size;
  const xpPoints = completedCount * 120;
  const rank = xpPoints >= 240 ? 'Sargento Blue/Red Team' : xpPoints >= 120 ? 'Operador Defensivo' : 'Recruta Cyber';

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-400">
      
      {/* GLOBAL HEADER BAR */}
      <header id="global-header-bar" className="bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-600 rounded-xl flex items-center justify-center p-2.5 shadow-[0_0_15px_rgba(8,145,178,0.4)]">
              <Shield className="text-white shrink-0" size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                ENV_SIMULATOR_<span className="text-cyan-500">v2.4</span>
              </h1>
              <p className="text-[10px] text-[#666] font-mono tracking-tight hidden sm:block">
                LATENCY: 12ms • <span className="text-green-500">AI_SYNCHRONIZED: 100%</span>
              </p>
            </div>
          </div>

          {/* User Score Stats / Gamification */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3.5 text-xs border-r border-[#1a1a1a] pr-4">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-[#666] uppercase tracking-widest font-mono">Rank</span>
                <span className="text-xs font-semibold text-zinc-300">{rank}</span>
              </div>
              <div className="h-9 w-28 bg-[#111] border border-[#222] rounded flex items-center justify-center font-mono text-[11px] text-cyan-400 font-bold shadow-inner">
                XP {xpPoints}
              </div>
              <div className="flex items-center text-[#666] gap-1 font-mono text-[10px]">
                <CheckCircle size={12} className="text-cyan-500" />
                <span>{completedCount}/{totalMissions} SOLVED</span>
              </div>
            </div>

            {activeMission && (
              <button
                id="back-dashboard-btn"
                onClick={() => setActiveMission(null)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111] hover:bg-[#161616] hover:text-white rounded text-xs font-mono font-semibold border border-[#222] transition cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>MENU_INICIAL</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* WORKSPACE AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6">
        
        {!activeMission ? (
          /* =======================================================
             VIEW 1: DASHBOARD DE SELEÇÃO DE MISSÕES E GERADOR IA
             ======================================================= */
          <div className="space-y-6">
            
            {/* Introdução / Banner de Boas-vindas */}
            <div className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-500 font-mono flex items-center gap-1.5">
                  <Activity size={12} className="animate-pulse" /> SIMULAÇÕES ATIVAS DE CIBERSEGURANÇA
                </span>
                <h2 className="text-xl font-medium tracking-tight text-white font-display">
                  Prática Autónoma em Ambientes Virtuais de Rede
                </h2>
                <p className="text-xs text-[#999] leading-relaxed">
                  Pratique vulnerabilidades do mundo real. Execute comandos técnicos no terminal interativo apoiado pela Inteligência Artificial e audite seus patches de segurança na hora.
                </p>
              </div>

              {/* Mini Stats box */}
              <div className="grid grid-cols-2 gap-3 shrink-0 w-full md:w-auto font-mono text-center">
                <div className="p-3 bg-[#111] rounded border border-[#222] min-w-[110px]">
                  <span className="text-[9px] text-[#666] block uppercase">NÍVEL</span>
                  <span className="text-xs font-bold text-cyan-400">{rank.split(' ')[0]}</span>
                </div>
                <div className="p-3 bg-[#111] rounded border border-[#222] min-w-[110px]">
                  <span className="text-[9px] text-[#666] block uppercase">PROGRES_BAR</span>
                  <span className="text-xs font-bold text-white">{completedCount} RESOLVIDAS</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Coluna Esquerda / Meio: Lista de Desafios Práticos */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <BookOpen size={16} className="text-[#666]" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#888]">
                    LAB_PALETTE_SELECTION
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {missions.map((mission) => {
                    const isCompleted = completedMissionIds.has(mission.id);
                    const isCustom = mission.category === 'Personalizado por IA';
                    
                    return (
                      <div
                        key={mission.id}
                        id={`mission-card-${mission.id}`}
                        className={`bg-[#080808] border transition duration-300 rounded-xl p-5 flex flex-col justify-between space-y-4 ${
                          isCompleted ? 'border-green-500/20 bg-green-950/5' : 'border-[#1a1a1a] hover:border-cyan-500/40 hover:bg-[#111]'
                        }`}
                      >
                        {/* Meta Tags */}
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase border ${
                            mission.category.includes('Ataque') ? 'bg-rose-950/40 text-rose-400 border-rose-900/30' :
                            mission.category.includes('Defesa') ? 'bg-blue-950/40 text-blue-400 border-blue-800/30' :
                            isCustom ? 'bg-cyan-950/40 text-cyan-400 border-cyan-800/30' : 'bg-purple-950/40 text-purple-400 border-purple-800/30'
                          }`}>
                            {mission.category}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-medium ${
                            mission.difficulty === 'Iniciante' ? 'text-emerald-400 bg-emerald-950/20' :
                            mission.difficulty === 'Intermediário' ? 'text-amber-400 bg-amber-950/20' : 'text-rose-400 bg-rose-950/20'
                          }`}>
                            {mission.difficulty}
                          </span>
                        </div>

                        {/* Title & Desc */}
                        <div className="space-y-1.5">
                          <h4 className="text-sm font-bold text-white leading-tight font-mono flex items-center gap-1.5">
                            {mission.title}
                            {isCompleted && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                          </h4>
                          <p className="text-xs text-[#999] leading-relaxed line-clamp-3">
                            {mission.description}
                          </p>
                        </div>

                        {/* Action CTA */}
                        <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#666]">
                            {mission.steps.length} objetivos • +120 XP
                          </span>
                          <button
                            id={`play-mission-btn-${mission.id}`}
                            onClick={() => handleStartMission(mission)}
                            className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition cursor-pointer ${
                              isCompleted
                                ? 'bg-green-900/20 border border-green-800/40 hover:bg-green-800/30 text-green-300'
                                : 'bg-[#111] border border-[#222] hover:border-cyan-500 hover:text-cyan-400 text-white'
                            }`}
                          >
                            {isCompleted ? 'Estudar de Novo' : 'Iniciar Lab'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna Direita: Gerador de Cenários Customizados com IA */}
              <div className="space-y-6">
                <CustomScenarioCreator onScenarioGenerated={handleCustomScenarioGenerated} />
                
                {/* Security Tips Banner */}
                <div className="bg-[#080808] border border-[#1a1a1a] rounded-lg p-4 font-mono text-xs text-[#999] space-y-2">
                  <div className="flex items-center space-x-1.5 text-zinc-200 font-bold uppercase">
                    <ShieldCheckIcon size={14} className="text-cyan-500" />
                    <span>DICA DE ESTUDO ÉTICO</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Todas as ferramentas executadas no terminal como <span className="text-zinc-300">nmap</span>, <span className="text-zinc-300">sqlmap</span> e <span className="text-zinc-300">iptables</span> são ambientes virtuais simulados e sandboxed de forma segura. O hacking ético deve ser exercido com responsabilidade exclusivamente em infraestruturas autorizadas.
                  </p>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* =======================================================
             VIEW 2: WORKSPACE ATIVO DA MISSÃO
             ======================================================= */
          <div className="space-y-6">
            
            {/* Mission Active Summary Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-[#666]">
                  <span>Cenário Ativo:</span>
                  <span className="text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-850">
                    {activeMission.category}
                  </span>
                  <span>• Dificuldade:</span>
                  <span className="text-amber-400 font-bold">
                    {activeMission.difficulty}
                  </span>
                </div>
                <h2 className="text-base font-mono font-bold text-white flex items-center gap-1.5">
                  {activeMission.title}
                  {completedMissionIds.has(activeMission.id) && (
                    <span className="text-[10px] bg-green-500 text-black px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      Completada!
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex space-x-2 text-xs">
                <button
                  id="reset-lab-btn"
                  onClick={() => handleStartMission(activeMission)}
                  className="px-3 py-1.5 bg-[#111] hover:bg-[#161616] text-[#e0e0e0] border border-[#222] rounded font-mono transition cursor-pointer"
                >
                  REINICIAR_DESAFIO
                </button>
              </div>
            </div>

            {/* Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LADO ESQUERDO: BRIEFING E TOPOLOGIA DE REDE (Lg: 5/12) */}
              <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
                
                {/* Briefing & Objectives checklists */}
                <div className="bg-[#080808] border border-[#1a1a1a] rounded-lg p-5 space-y-4">
                  <h3 className="text-xs font-mono font-bold text-[#888] uppercase pb-2 border-b border-[#1a1a1a] flex items-center gap-1.5">
                    <KeyRound size={13} className="text-cyan-500" /> briefing do cenário
                  </h3>
                  <div className="text-xs text-[#999] leading-relaxed whitespace-pre-line prose prose-invert font-sans">
                    {activeMission.briefing}
                  </div>

                  {/* Objective Steps Checklist */}
                  <div className="pt-3 border-t border-[#1a1a1a] space-y-2.5">
                    <h4 className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wide">
                      Objetivos da Missão:
                    </h4>
                    <div className="space-y-2 font-mono text-xs">
                      {steps.map((step) => (
                        <div
                          key={step.id}
                          className={`flex items-start gap-2.5 p-3 rounded transition-colors ${
                            step.isCompleted
                              ? 'bg-green-950/10 text-green-400 border border-green-900/20'
                              : 'bg-[#111] border border-[#222] text-[#888]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={step.isCompleted}
                            readOnly
                            className="mt-0.5 rounded border-[#333] text-cyan-500 focus:ring-0 cursor-not-allowed pointer-events-none"
                          />
                          <div className="space-y-0.5">
                            <span className={`font-bold block ${step.isCompleted ? 'line-through opacity-60' : 'text-zinc-200'}`}>
                              {step.title}
                            </span>
                            <span className="text-[11px] leading-relaxed block text-[#666]">
                              {step.instruction}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Network Map Segment */}
                <div className="flex-1">
                  <NetworkMap
                    nodes={nodes}
                    onSelectNode={setSelectedNode}
                    selectedNode={selectedNode}
                  />
                </div>

              </div>

              {/* LADO DIREITO: TABS INTERATIVAS (TERMINAL, CODE EDITOR, MENTOR) (Lg: 7/12) */}
              <div className="lg:col-span-7 space-y-4 flex flex-col h-full">
                
                {/* Interaction Tabs */}
                <div className="flex items-center space-x-1 border-b border-[#1a1a1a] pb-1 text-xs">
                  <button
                    id="tab-terminal-btn"
                    onClick={() => setActiveTab('terminal')}
                    className={`px-3 py-1.5 rounded transition font-mono flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'terminal'
                        ? 'bg-[#0a0a0a] border border-[#1a1a1a] text-cyan-400 font-bold shadow'
                        : 'text-[#444] hover:text-zinc-300'
                    }`}
                  >
                    <TerminalIcon size={13} />
                    Terminal Sandbox
                  </button>

                  {activeMission.vulnerableFiles && activeMission.vulnerableFiles.length > 0 && (
                    <button
                      id="tab-editor-btn"
                      onClick={() => setActiveTab('editor')}
                      className={`px-3 py-1.5 rounded transition font-mono flex items-center gap-1.5 cursor-pointer ${
                        activeTab === 'editor'
                          ? 'bg-[#0a0a0a] border border-[#1a1a1a] text-cyan-400 font-bold shadow'
                          : 'text-[#444] hover:text-zinc-300'
                      }`}
                    >
                      <Code size={13} />
                      Editor de Código
                    </button>
                  )}

                  <button
                    id="tab-mentor-btn"
                    onClick={() => setActiveTab('mentor')}
                    className={`px-3 py-1.5 rounded transition font-mono flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'mentor'
                        ? 'bg-[#0a0a0a] border border-[#1a1a1a] text-cyan-400 font-bold shadow'
                        : 'text-[#444] hover:text-zinc-300'
                    }`}
                  >
                    <ShieldAlert size={13} />
                    Mentor IA
                  </button>
                </div>

                {/* Active Tab Panel */}
                <div className="flex-1 min-h-[350px] md:min-h-[420px]">
                  {activeTab === 'terminal' && (
                    <Terminal
                      mission={activeMission}
                      steps={steps}
                      nodes={nodes}
                      onStepComplete={handleStepComplete}
                      onUpdateNodes={handleUpdateNodes}
                      terminalLines={terminalLines}
                      setTerminalLines={setTerminalLines}
                    />
                  )}

                  {activeTab === 'editor' && (
                    <PatchEditor
                      mission={activeMission}
                      onStepComplete={handleStepComplete}
                      onUpdateNodeStatus={handleUpdateNodeStatus}
                    />
                  )}

                  {activeTab === 'mentor' && (
                    <MentorTab activeMission={activeMission} />
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer id="global-footer" className="bg-[#0a0a0a] border-t border-[#1a1a1a] py-5 px-6 text-center mt-auto font-mono text-[10px] text-[#444]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Cyber Shield Simulator. Projetado para fins estritamente educativos.
          </span>
          <span className="flex items-center gap-1.5">
            <Activity size={10} className="text-cyan-500 animate-pulse" /> IA integrada: Gemini 3.5 Flash
          </span>
        </div>
      </footer>

    </div>
  );
}

// Helpers local icons
function ShieldCheckIcon({ size, className }: { size: number; className?: string }) {
  return <Shield size={size} className={className} />;
}
