import React, { useState, useEffect } from 'react';
import { Mission, VulnerableFile } from '../types';
import { Code, CheckCircle, AlertTriangle, ShieldCheck, Play, HelpCircle, FileText } from 'lucide-react';

interface PatchEditorProps {
  mission: Mission;
  onStepComplete: (stepId: number) => void;
  onUpdateNodeStatus: (nodeId: string, status: 'secure' | 'compromised') => void;
}

export default function PatchEditor({ mission, onStepComplete, onUpdateNodeStatus }: PatchEditorProps) {
  const files = mission.vulnerableFiles || [];
  const [selectedFile, setSelectedFile] = useState<VulnerableFile | null>(null);
  const [code, setCode] = useState('');
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{ approved: boolean; feedback: string } | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setCode(files[0].currentContent || files[0].initialContent);
      setAuditResult(null);
    } else {
      setSelectedFile(null);
      setCode('');
      setAuditResult(null);
    }
  }, [mission]);

  const handleResetCode = () => {
    if (selectedFile) {
      setCode(selectedFile.initialContent);
      setAuditResult(null);
    }
  };

  const handleAuditPatch = async () => {
    if (!selectedFile) return;
    setAuditing(true);
    setAuditResult(null);

    try {
      const response = await fetch('/api/gemini/analyze-patch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedFile.path,
          fileContent: code,
          briefing: mission.briefing,
          vulnerabilityDescription: selectedFile.vulnerabilityDescription,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha no auditor automático de código.');
      }

      const data = await response.json();
      setAuditResult(data);

      if (data.approved) {
        // Encontra o passo da missão focado em submeter patch e marca concluído
        const patchStep = mission.steps.find(s => s.triggerCommand.includes('patch') || s.triggerCommand.includes('submeter'));
        if (patchStep) {
          onStepComplete(patchStep.id);
        } else {
          // Fallback, completa o último passo da missão
          onStepComplete(mission.steps[mission.steps.length - 1].id);
        }

        // Se corrigiu a vulnerabilidade, as defesas do servidor sobem! Vamos assegurar o nó vulnerável
        const webserverNode = mission.networkNodes.find(n => n.role === 'webserver' || n.id === 'auth-server');
        if (webserverNode) {
          onUpdateNodeStatus(webserverNode.id, 'secure');
        }
      }
    } catch (err: any) {
      setAuditResult({
        approved: false,
        feedback: `⚠️ Falha ao se conectar com a IA Auditora: ${err.message}. Tente novamente.`,
      });
    } finally {
      setAuditing(false);
    }
  };

  if (files.length === 0) {
    return (
      <div id="no-files-container" className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#080808] border border-[#1a1a1a] rounded-xl">
        <Code size={40} className="text-[#333] mb-2" />
        <span className="text-sm font-mono text-[#888] font-bold uppercase">Sem Código Fonte Vulnerável</span>
        <p className="text-xs text-[#666] max-w-sm mt-1 leading-relaxed">
          Esta missão é voltada para defesa de rede e terminal. Não há arquivos de software pendentes de correção nesta etapa.
        </p>
      </div>
    );
  }

  return (
    <div id="patch-editor-container" className="flex flex-col h-full bg-[#080808] border border-[#1a1a1a] rounded-xl overflow-hidden font-mono">
      {/* Editor Tab Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-[#1a1a1a] text-xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <FileText size={14} className="text-cyan-500" />
          <span className="font-bold text-[#e0e0e0] truncate">{selectedFile?.path}</span>
          <span className="text-[9px] bg-cyan-950/40 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/30 uppercase font-bold">
            {selectedFile?.language}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            id="reset-code-btn"
            onClick={handleResetCode}
            className="px-2.5 py-1.5 text-[10px] bg-[#111] hover:bg-[#161616] text-[#888] hover:text-[#fff] border border-[#222] rounded transition cursor-pointer"
          >
            Resetar Código
          </button>
          <button
            id="audit-code-btn"
            onClick={handleAuditPatch}
            disabled={auditing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded font-bold text-[11px] shadow-[0_0_15px_rgba(8,145,178,0.4)] transition cursor-pointer"
          >
            <Play size={10} />
            {auditing ? 'Verificando...' : 'Auditar Patch com IA'}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] overflow-y-auto">
        
        {/* Editor de Texto Simulado */}
        <div className="flex flex-col h-full bg-[#050505]">
          <div className="bg-[#0a0a0a] px-3 py-1.5 border-b border-[#1a1a1a] text-[10px] text-[#666] uppercase flex justify-between">
            <span>Editor Interativo</span>
            <span>Evite SQLi e MD5</span>
          </div>
          <div className="relative flex-1 flex text-xs">
            {/* Números das linhas */}
            <div className="p-3 pr-1 text-right text-[#444] select-none bg-[#050505]/40 font-mono w-10">
              {Array.from({ length: Math.max(code.split('\n').length, 12) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Input textarea */}
            <textarea
              id="vulnerable-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-3 bg-transparent text-zinc-200 font-mono text-xs focus:outline-none focus:ring-0 resize-none min-h-[220px] h-full"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Auditoria / Detalhes de Vulnerabilidade */}
        <div className="flex flex-col bg-[#080808]">
          <div className="bg-[#0a0a0a] px-3 py-1.5 border-b border-[#1a1a1a] text-[10px] text-[#666] uppercase flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-500" />
            <span>Ficha da Vulnerabilidade & Auditoria</span>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs leading-relaxed max-h-[350px] md:max-h-none">
            {/* Vulnerabilidade Ficha */}
            <div className="p-4 bg-amber-950/10 border border-amber-900/20 rounded-lg">
              <h4 className="font-bold text-amber-500 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Descrição da Falha
              </h4>
              <p className="text-[#999] text-[11px] leading-relaxed">
                {selectedFile?.vulnerabilityDescription}
              </p>
            </div>

            {/* Spinner de Auditoria */}
            {auditing && (
              <div className="flex flex-col items-center justify-center p-6 bg-cyan-950/10 border border-cyan-800/20 rounded text-center space-y-2">
                <div className="w-6 h-6 border-2 border-t-transparent border-cyan-500 rounded-full animate-spin"></div>
                <span className="text-[11px] text-cyan-400 font-bold animate-pulse">
                  AUDITOR IA REVISANDO CÓDIGO FONTE...
                </span>
                <p className="text-[10px] text-[#666]">
                  O analista de DevSecOps está verificando Queries Parametrizadas e Criptografia segura.
                </p>
              </div>
            )}

            {/* Resultado do Audit */}
            {auditResult && (
              <div className={`p-4 border rounded-lg ${
                auditResult.approved
                  ? 'bg-emerald-950/10 border-emerald-900/30'
                  : 'bg-rose-950/10 border-rose-900/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {auditResult.approved ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                      <ShieldCheck size={16} />
                      APPROVED_PATCH_SECURE
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-500 font-bold uppercase tracking-wider text-[11px]">
                      <AlertTriangle size={16} />
                      AUDIT_REJECTED_VULNERABLE
                    </div>
                  )}
                </div>
                
                {/* Markdown Feedback do Auditor */}
                <div className="text-[#999] whitespace-pre-wrap text-[11px] leading-relaxed font-sans mt-2">
                  {auditResult.feedback}
                </div>
              </div>
            )}

            {!auditing && !auditResult && (
              <div className="text-center py-6 text-[#555]">
                <HelpCircle size={20} className="mx-auto text-[#333] mb-1.5" />
                <span className="text-[11px]">Conserte o arquivo e clique em "Auditar Patch com IA" para verificar.</span>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
