import React from 'react';
import { NetworkNode } from '../types';
import { Shield, ShieldAlert, Radio, Server, Monitor, HelpCircle, Activity } from 'lucide-react';

interface NetworkMapProps {
  nodes: NetworkNode[];
  onSelectNode: (node: NetworkNode) => void;
  selectedNode: NetworkNode | null;
}

export default function NetworkMap({ nodes, onSelectNode, selectedNode }: NetworkMapProps) {
  // Posicionamento estático dos nós baseado no ID para criar uma topologia limpa com margens seguras
  const getNodePosition = (id: string, index: number, total: number) => {
    // Classificar todos os nós da rede em colunas lógicas
    // Esquerda: Atacantes e Workstations de Dev
    const leftNodes = nodes.filter(n => n.role === 'attacker' || n.id === 'dev-workspace');
    // Centro: Gateways/Firewalls
    const centerNodes = nodes.filter(n => n.role === 'gateway');
    // Direita: Servidores, Bancos de Dados e outros alvos internos
    const rightNodes = nodes.filter(n => n.role !== 'attacker' && n.role !== 'gateway' && n.id !== 'dev-workspace');

    const node = nodes.find(n => n.id === id);
    if (!node) {
      return { x: 50, y: 50 };
    }

    let x = 50;
    let y = 50;

    if (leftNodes.some(n => n.id === id)) {
      x = 16; // Coluna Esquerda expandida para fora para dar mais espaço
      const idx = leftNodes.findIndex(n => n.id === id);
      const count = leftNodes.length;
      if (count === 1) {
        y = 50;
      } else {
        y = 30 + (idx / (count - 1)) * 40; // Distribuir verticalmente de 30% a 70%
      }
    } else if (centerNodes.some(n => n.id === id)) {
      x = 50; // Coluna Central
      const idx = centerNodes.findIndex(n => n.id === id);
      const count = centerNodes.length;
      if (count === 1) {
        y = 50;
      } else {
        y = 30 + (idx / (count - 1)) * 40;
      }
    } else {
      x = 84; // Coluna Direita expandida para fora
      const idx = rightNodes.findIndex(n => n.id === id);
      const count = rightNodes.length;
      if (count === 1) {
        y = 50;
      } else if (count === 2) {
        // Se houver 2 nós no alvo, colocamos um acima e um abaixo bem separados
        y = idx === 0 ? 30 : 70;
      } else {
        y = 20 + (idx / (count - 1)) * 60; // Distribuir verticalmente de 20% a 80%
      }
    }

    return { x, y };
  };

  const getStatusColor = (status: NetworkNode['status']) => {
    switch (status) {
      case 'secure':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20 shadow-emerald-950/20';
      case 'compromised':
        return 'text-rose-400 border-rose-500/40 bg-rose-950/20 shadow-rose-950/20 animate-pulse';
      case 'scanned':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.25)]';
      case 'offline':
        return 'text-zinc-500 border-[#1a1a1a] bg-[#0a0a0a] shadow-black';
      default:
        return 'text-zinc-400 border-[#222] bg-[#111]';
    }
  };

  const getRoleIcon = (role: NetworkNode['role']) => {
    const size = 18;
    switch (role) {
      case 'attacker':
        return <Radio className="animate-pulse" size={size} />;
      case 'gateway':
        return <Shield size={size} />;
      case 'webserver':
        return <Server size={size} />;
      case 'database':
        return <Server size={size} className="brightness-110 text-cyan-400" />;
      case 'workstation':
        return <Monitor size={size} />;
      default:
        return <HelpCircle size={size} />;
    }
  };

  return (
    <div id="network-topology-container" className="flex flex-col h-full bg-[#080808] border border-[#1a1a1a] rounded-xl overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="flex items-center space-x-2">
          <Activity size={14} className="text-cyan-500 animate-pulse" />
          <span className="text-xs font-mono font-medium tracking-tight text-[#e0e0e0]">
            TOPOLOGIA_REDE_ATIVA
          </span>
        </div>
        <div className="flex space-x-3 text-[9px] font-mono tracking-tight text-[#666]">
          <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> SECURE</span>
          <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mr-1.5"></span> SCANNED</span>
          <span className="flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span> INTRUDED</span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 bg-[#050505] min-h-[330px] lg:min-h-[350px] overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        {/* Draw Connection Lines first to keep them behind nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="grad-secure" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="grad-danger" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {(() => {
            const gatewayNode = nodes.find(n => n.role === 'gateway');
            const left = nodes.filter(n => n.role === 'attacker' || n.id === 'dev-workspace');
            const right = nodes.filter(n => n.role !== 'attacker' && n.role !== 'gateway' && n.id !== 'dev-workspace');

            const connections: Array<{ from: string; to: string }> = [];

            if (gatewayNode) {
              // Conecta atacantes/dev ao gateway
              left.forEach(l => {
                connections.push({ from: l.id, to: gatewayNode.id });
              });
              // Conecta o gateway aos servidores/banco de dados
              right.forEach(r => {
                connections.push({ from: gatewayNode.id, to: r.id });
              });
            } else {
              // Se não houver gateway (ex: Missão 3), conecta diretamente as origens aos destinos
              left.forEach(l => {
                right.forEach(r => {
                  connections.push({ from: l.id, to: r.id });
                });
              });
            }

            return connections.map(({ from, to }, idx) => {
              const nodeFrom = nodes.find(n => n.id === from);
              const nodeTo = nodes.find(n => n.id === to);
              if (!nodeFrom || !nodeTo) return null;

              const idxFrom = nodes.findIndex(n => n.id === from);
              const idxTo = nodes.findIndex(n => n.id === to);

              const posFrom = getNodePosition(from, idxFrom, nodes.length);
              const posTo = getNodePosition(to, idxTo, nodes.length);

              const isCompromised = nodeFrom.status === 'compromised' || nodeTo.status === 'compromised';

              return (
                <g key={`line-${from}-${to}-${idx}`}>
                  <line
                    x1={`${posFrom.x}%`}
                    y1={`${posFrom.y}%`}
                    x2={`${posTo.x}%`}
                    y2={`${posTo.y}%`}
                    stroke={isCompromised ? 'url(#grad-danger)' : 'url(#grad-secure)'}
                    strokeWidth={isCompromised ? '2' : '1'}
                    strokeDasharray={isCompromised ? '4' : 'none'}
                  />
                  {/* Sinalizador animado de pulso na conexão */}
                  <circle
                    r="2.5"
                    fill={isCompromised ? '#f43f5e' : '#06b6d4'}
                    className="opacity-85 animate-pulse"
                  >
                    <animate
                      attributeName="cx"
                      from={`${posFrom.x}%`}
                      to={`${posTo.x}%`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      from={`${posFrom.y}%`}
                      to={`${posTo.y}%`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            });
          })()}
        </svg>

        {/* Nodes Placement */}
        <div className="absolute inset-0 p-4">
          {nodes.map((node, index) => {
            const pos = getNodePosition(node.id, index, nodes.length);
            const isSelected = selectedNode?.id === node.id;
            const statusStyle = getStatusColor(node.status);

            return (
              <button
                key={node.id}
                id={`node-btn-${node.id}`}
                onClick={() => onSelectNode(node)}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute w-[114px] min-h-[64px] p-1.5 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${statusStyle} ${
                  isSelected ? 'scale-110 ring-2 ring-cyan-500 z-10 border-cyan-400 shadow-[0_0_15px_rgba(8,145,178,0.35)]' : 'hover:scale-105 hover:bg-[#111]'
                }`}
              >
                <div className="flex items-center justify-center mb-0.5">
                  {getRoleIcon(node.role)}
                </div>
                <span className="text-[9.5px] font-mono font-bold leading-tight text-center break-words whitespace-normal line-clamp-2 max-w-[102px] px-1">
                  {node.label}
                </span>
                <span className="text-[8.5px] font-mono opacity-50 mt-0.5">
                  {node.ip}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Side drawer or footer */}
      {selectedNode && (
        <div id="node-details-drawer" className="p-4 bg-[#0a0a0a] border-t border-[#1a1a1a] font-mono text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-[#e0e0e0] flex items-center gap-1.5">
              {getRoleIcon(selectedNode.role)} {selectedNode.label}
            </span>
            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
              selectedNode.status === 'secure' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
              selectedNode.status === 'compromised' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30 animate-pulse' :
              selectedNode.status === 'scanned' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/30' :
              'bg-[#111] text-zinc-500'
            }`}>
              {selectedNode.status === 'secure' ? 'SECURE' : 
               selectedNode.status === 'compromised' ? 'INTRUDED' : 
               selectedNode.status === 'scanned' ? 'SCANNED' : 'OFFLINE'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#999]">
            <div><span className="text-[#666]">IP:</span> {selectedNode.ip}</div>
            <div><span className="text-[#666]">S.O:</span> {selectedNode.os}</div>
            <div className="col-span-2 mt-1">
              <span className="text-[#666] block mb-0.5">Serviços Detectados:</span>
              <div className="flex flex-wrap gap-1">
                {selectedNode.services.map((srv, idx) => (
                  <span key={idx} className="bg-[#111] text-[#ccc] px-2 py-0.5 rounded text-[9px] border border-[#222]">
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
