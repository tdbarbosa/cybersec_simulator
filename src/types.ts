export interface MissionStep {
  id: number;
  title: string;
  instruction: string;
  hint: string;
  triggerCommand: string; // O comando ou ação que valida esta etapa (pode ser Regex ou termo chave)
  isCompleted: boolean;
}

export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  role: 'gateway' | 'webserver' | 'database' | 'workstation' | 'attacker';
  status: 'secure' | 'compromised' | 'scanned' | 'offline';
  os: string;
  services: string[];
}

export interface VulnerableFile {
  path: string;
  language: string;
  initialContent: string;
  currentContent?: string;
  vulnerabilityDescription: string;
  solutionExplanation: string;
}

export type MissionCategory = 'Ataque (Pentest)' | 'Defesa (Blue Team)' | 'Análise de Código' | 'Personalizado por IA';

export interface Mission {
  id: string;
  title: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  category: MissionCategory;
  description: string;
  briefing: string;
  steps: MissionStep[];
  networkNodes: NetworkNode[];
  vulnerableFiles?: VulnerableFile[];
}

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'ai';
  timestamp: string;
}
