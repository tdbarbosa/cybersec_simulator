import { Mission } from '../types';

export const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'm1-sqli-pivot',
    title: 'Invasão DMZ: SQL Injection & Pivot',
    difficulty: 'Iniciante',
    category: 'Ataque (Pentest)',
    description: 'Explore uma falha de SQL Injection clássica para ler a tabela de administração e pivotar para o banco interno.',
    briefing: `A corporação "SafeCorp" possui um portal público em seu Servidor Web DMZ (192.168.10.15). Suspeita-se que este servidor possui uma falha grave de SQL Injection na tela de busca de notícias.
    
Seu objetivo como Analista de Pentest Ético é mapear a rede, identificar as portas vulneráveis no Servidor Web, explorar o campo de entrada para obter as credenciais administrativas e, em seguida, simular o acesso interno.`,
    steps: [
      {
        id: 1,
        title: 'Mapeamento de Rede (Nmap)',
        instruction: 'Execute uma varredura de rede usando o Nmap para descobrir quais portas estão abertas no Servidor Web (IP: 192.168.10.15). Dica: nmap 192.168.10.15',
        hint: 'Use o comando: nmap 192.168.10.15',
        triggerCommand: 'nmap 192.168.10.15',
        isCompleted: false
      },
      {
        id: 2,
        title: 'Explorar SQL Injection (Sqlmap)',
        instruction: 'Use o utilitário "sqlmap" para analisar a URL vulnerável http://192.168.10.15/news.php?id=1 para obter as tabelas do banco de dados.',
        hint: 'Digite: sqlmap -u "http://192.168.10.15/news.php?id=1" --dbs',
        triggerCommand: 'sqlmap',
        isCompleted: false
      },
      {
        id: 3,
        title: 'Extrair credenciais admin',
        instruction: 'Extraia as credenciais de usuários e senhas da tabela de usuários utilizando sqlmap ou use uma query manual com UNION SELECT admin_password.',
        hint: 'Comando recomendado: sqlmap -u "http://192.168.10.15/news.php?id=1" -D news_db -T users --dump',
        triggerCommand: '--dump',
        isCompleted: false
      },
      {
        id: 4,
        title: 'Acesso Remoto via SSH',
        instruction: 'Agora que você possui as credenciais administrativas (usuário: admin, senha: masterkey2026), conecte-se ao terminal SSH do servidor para concluir o pivot.',
        hint: 'Use: ssh admin@192.168.10.15',
        triggerCommand: 'ssh admin@192.168.10.15',
        isCompleted: false
      }
    ],
    networkNodes: [
      {
        id: 'attacker-pc',
        label: 'Estação Kali do Pentester (Você)',
        ip: '192.168.10.250',
        role: 'attacker',
        status: 'secure',
        os: 'Kali Linux Rolling',
        services: ['Metasploit', 'Nmap v7.94', 'Hydra v9.5']
      },
      {
        id: 'gateway',
        label: 'Roteador de Borda DMZ',
        ip: '192.168.10.1',
        role: 'gateway',
        status: 'secure',
        os: 'Cisco IOS v15.4',
        services: ['BGP', 'OSPF', 'NAT Engine']
      },
      {
        id: 'dmz-webserver',
        label: 'Servidor Web DMZ público',
        ip: '192.168.10.15',
        role: 'webserver',
        status: 'scanned',
        os: 'Ubuntu Server 22.04 LTS',
        services: ['Apache v2.4.52', 'PHP v8.1.2', 'OpenSSH v8.9p1']
      },
      {
        id: 'db-internal',
        label: 'Banco de Dados Interno (Postgres)',
        ip: '192.168.20.44',
        role: 'database',
        status: 'secure',
        os: 'RedHat Enterprise Linux 9',
        services: ['PostgreSQL v15.2', 'Private SSH']
      }
    ]
  },
  {
    id: 'm2-firewall-ddos',
    title: 'Defesa de Borda: Mitigando Brute-Force & DDoS',
    difficulty: 'Intermediário',
    category: 'Defesa (Blue Team)',
    description: 'Identifique o IP atacante e configure o firewall de borda para neutralizar as tentativas de intrusão e flood.',
    briefing: `O sistema de detecção de intrusão (IDS) da empresa alertou que um servidor web crítico (10.0.0.10) está enfrentando uma lentidão severa. Suspeita-se de um ataque coordenado de Brute-Force SSH e Flood HTTP originado da rede externa (IP suspeito: 198.51.100.44).
    
Como Administrador de Segurança (Blue Team), você deve acessar o Gateway de Firewall (10.0.0.1), analisar os pacotes ativos, e configurar regras estritas do "iptables" para proteger as estações de trabalho e os servidores internos da empresa.`,
    steps: [
      {
        id: 1,
        title: 'Verificar conexões ativas',
        instruction: 'Use o utilitário "netstat" no gateway ou execute um monitoramento de pacotes para listar quais IPs externos estão inundando o tráfego do servidor.',
        hint: 'Execute: netstat -an ou verifique os logs com: tail -n 20 /var/log/syslog',
        triggerCommand: 'netstat',
        isCompleted: false
      },
      {
        id: 2,
        title: 'Bloquear IP atacante no Firewall',
        instruction: 'Insira uma regra de DROP no "iptables" para bloquear completamente qualquer pacote de entrada proveniente do IP invasor 198.51.100.44.',
        hint: 'Execute: iptables -A INPUT -s 198.51.100.44 -j DROP',
        triggerCommand: 'iptables -A INPUT -s 198.51.100.44 -j DROP',
        isCompleted: false
      },
      {
        id: 3,
        title: 'Limitar conexões simultâneas',
        instruction: 'Adicione uma regra extra para limitar conexões simultâneas de qualquer outro IP para evitar futuros ataques de DDoS na porta 80.',
        hint: 'Use o comando: iptables -A INPUT -p tcp --dport 80 -m connlimit --connlimit-above 10 -j REJECT',
        triggerCommand: 'connlimit',
        isCompleted: false
      },
      {
        id: 4,
        title: 'Validar Defesas',
        instruction: 'Execute o comando de verificação "iptables -L -n" para imprimir as regras em vigor e confirmar o bloqueio permanente.',
        hint: 'Comando: iptables -L -n',
        triggerCommand: 'iptables -L -n',
        isCompleted: false
      }
    ],
    networkNodes: [
      {
        id: 'attacker-cnc',
        label: 'Botnet / IP Externo Hostil',
        ip: '198.51.100.44',
        role: 'attacker',
        status: 'compromised',
        os: 'Unknown Linux',
        services: ['Hacking scripts', 'HTTP Flooder']
      },
      {
        id: 'gateway-fw',
        label: 'Gateway / Firewall Principal',
        ip: '10.0.0.1',
        role: 'gateway',
        status: 'secure',
        os: 'PfSense / BSD-based',
        services: ['IPFilter', 'Syslog Daemon', 'SSH Control']
      },
      {
        id: 'internal-web',
        label: 'Servidor Web Intranet',
        ip: '10.0.0.10',
        role: 'webserver',
        status: 'compromised',
        os: 'Debian Stable OS',
        services: ['Nginx v1.21 (Sobrecarregado)', 'PHP-FPM']
      },
      {
        id: 'workstation-user',
        label: 'Estação de Operação Interna',
        ip: '10.0.0.100',
        role: 'workstation',
        status: 'secure',
        os: 'Windows 11 Enterprise',
        services: ['Active Directory Domain', 'Endpoint Antivirus']
      }
    ]
  },
  {
    id: 'm3-secure-code',
    title: 'Auditoria de Código: Corrigindo Login SQLi e Cripto Fraca',
    difficulty: 'Avançado',
    category: 'Análise de Código',
    description: 'Analise o script de login de uma API em Node.js, identifique as falhas de segurança e escreva um patch para torná-lo seguro.',
    briefing: `A equipe de desenvolvimento da SafeCorp desenvolveu um endpoint de login rápido. Entretanto, o analista júnior utilizou queries dinâmicas concatenadas (extremamente vulneráveis a SQL Injection) e comparação direta de hashes MD5 puros sem sal (Salt).
    
Seu papel como Engenheiro de Software Securo (AppSec) é revisar o arquivo de login na aba "Editor de Código", consertar as falhas substituindo por consultas parametrizadas e implementar bcrypt para comparação de senhas hash, e enviar para validação automática da IA.`,
    steps: [
      {
        id: 1,
        title: 'Revisar falha de injeção',
        instruction: 'Clique na aba "Editor de Código" ao lado do terminal. Analise a query SQL dinâmica que concatena "req.body.user" diretamente.',
        hint: 'Observe a linha: "SELECT * FROM users WHERE username = \'" + user + "\' AND ..." ',
        triggerCommand: 'revisar_codigo',
        isCompleted: false
      },
      {
        id: 2,
        title: 'Aplicar Queries Parametrizadas',
        instruction: 'No Editor de Código, reescreva a consulta usando o padrão parametrizado (ex: db.query("SELECT * FROM users WHERE username = ? AND password_hash = ?", [user, password]) ou similar) ou use autenticação robusta.',
        hint: 'Use placeholders "?" no comando SQL e forneça um array de parâmetros para evitar injeções maliciosas.',
        triggerCommand: 'parametrizar_sql',
        isCompleted: false
      },
      {
        id: 3,
        title: 'Substituir Hash MD5 Fraco por Bcrypt',
        instruction: 'Substitua a validação de hash MD5 insegura pela comparação segura do pacote bcrypt (usando bcrypt.compareSync ou bcrypt.compare de forma apropriada).',
        hint: 'Em vez de "md5(req.body.password) == db_hash", use "bcrypt.compareSync(password, db_hash)".',
        triggerCommand: 'bcrypt',
        isCompleted: false
      },
      {
        id: 4,
        title: 'Submeter Código e Validar via IA',
        instruction: 'Quando terminar de reescrever o código de login no editor de texto, clique no botão "Auditar Patch com IA" para que o DevSecOps analise sua solução.',
        hint: 'Clique no botão verde de Auditoria no canto superior do painel de código.',
        triggerCommand: 'submeter_patch',
        isCompleted: false
      }
    ],
    networkNodes: [
      {
        id: 'dev-workspace',
        label: 'Seu Ambiente DevSecOps',
        ip: '10.50.10.15',
        role: 'workstation',
        status: 'secure',
        os: 'Ubuntu Workstation',
        services: ['VSCode Editor', 'NodeJS v20', 'ESLint Plugin']
      },
      {
        id: 'auth-server',
        label: 'Servidor de Autenticação API',
        ip: '10.50.10.22',
        role: 'webserver',
        status: 'scanned',
        os: 'Ubuntu Server 22.04',
        services: ['NodeJS / Express', 'SQLite Database', 'PM2 Service']
      }
    ],
    vulnerableFiles: [
      {
        path: 'services/authService.js',
        language: 'javascript',
        vulnerabilityDescription: 'SQL Injection clássica na query de busca de usuários (username concatenado) e uso de hash MD5 obsoleto para verificação de senhas.',
        solutionExplanation: 'Utilizar queries com placeholders (?) passando um array de valores ao driver de banco de dados, e substituir o algoritmo de criptografia obsoleto MD5 por bcrypt.compare para proteção contra ataques de dicionário e rainbow tables.',
        initialContent: `// API de Autenticação SafeCorp v1.0 (Vulnerável)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5'); // MD5 obsoleto!
const db = new sqlite3.Database(':memory:');

// Configurando banco de dados em memória para demonstração
db.serialize(() => {
  db.run("CREATE TABLE users (id INT, username TEXT, password_hash TEXT)");
  db.run("INSERT INTO users VALUES (1, 'admin', '5f4dcc3b5aa765d61d8327deb882cf99')"); // md5 de 'password'
});

function loginUser(req, res) {
  const user = req.body.username;
  const password = req.body.password;

  // ⚠️ VULNERABILIDADE 1: SQL Injection na consulta abaixo por concatenação direta!
  // ⚠️ VULNERABILIDADE 2: Uso de algoritmo MD5 puro sem salt. Muito fácil de quebrar.
  const hash = md5(password);
  const query = "SELECT * FROM users WHERE username = '" + user + "' AND password_hash = '" + hash + "'";
  
  console.log("Executando Query:", query);

  db.get(query, (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
    if (row) {
      res.json({ success: true, message: "Login realizado com sucesso!", token: "JWT_SECURE_TOKEN_2026" });
    } else {
      res.status(401).json({ success: false, error: "Usuário ou senha incorretos." });
    }
  });
}

module.exports = { loginUser };`
      }
    ]
  }
];
