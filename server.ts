import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize the Google Gen AI client with appropriate User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper function to handle robust Gemini API calls with retries and a fallback model in case of 503/429/UNAVAILABLE errors
async function generateContentWithRetry(params: any, maxRetries = 3) {
  const modelsToTry = [params.model || "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const currentParams = {
          ...params,
          model: modelName,
        };
        return await ai.models.generateContent(currentParams);
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.code || error?.error?.code;
        const msg = (error?.message || "").toLowerCase();
        
        // 503 Service Unavailable, 429 Too Many Requests, or containing overload/rate limit indicator text
        const isTemporary =
          status === 503 ||
          status === 429 ||
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("unavailable") ||
          msg.includes("high demand") ||
          msg.includes("overloaded") ||
          msg.includes("temporary");

        if (isTemporary && attempt < maxRetries - 1) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[Gemini API] Temporary error on model ${modelName} (${error?.message || status}). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // If it's not a temporary error, or we used all retries for this model, break and try the next model
          break;
        }
      }
    }
    console.warn(`[Gemini API] Model ${modelName} failed. Trying fallback model if available...`);
  }
  throw lastError;
}

// Endpoint 1: Simular terminal de cibersegurança com IA
app.post("/api/gemini/terminal", async (req, res) => {
  try {
    const { command, mission, steps, nodes, history } = req.body;

    const systemInstruction = `
Você é o motor de simulação de terminal de rede de um laboratório prático de Cibersegurança.
O usuário está jogando/estudando em um cenário de segurança.
Seu objetivo é processar o comando digitado pelo usuário e responder exatamente como um console de terminal Linux realista responderia.

REGRAS DE SIMULAÇÃO:
1. Suporte comandos básicos do Linux (ls, cat, cd, ssh, ping, clear) e ferramentas hacker comuns (nmap, sqlmap, hydra, iptables, ncat, curl, metasploit/msfconsole).
2. Se o comando for relevante para a missão atual ("${mission.title}"), simule as saídas de forma técnica e realista. Por exemplo:
   - Se usarem nmap contra um IP do cenário, liste as portas abertas (ex: 80, 22, 3306) dependendo do estado do nó.
   - Se usarem sqlmap ou exploits, mostre logs de varredura técnica de banco de dados ou invasão de sessão com sucesso/falha condizente.
   - Se usarem iptables para bloquear tráfego, configure a regra simulada e retorne confirmação.
3. Se o comando de fato atingir um dos objetivos não concluídos da missão, marque o respectivo passo como concluído.
4. Se o comando alterar o estado da rede (ex: hackeou um servidor, bloqueou um ataque), retorne o status atualizado dos nós.
5. Os comandos devem retornar mensagens e logs em inglês para simular o terminal real, mas mensagens explicativas adicionais (se houver) ou dicas podem ser em português.

A resposta deve ser obrigatoriamente um objeto JSON com:
{
  "output": "Texto da saída do terminal. Use quebras de linha \\n e mantenha o estilo hacker/Linux técnico.",
  "stepCompletedId": null ou o número (id) do passo concluído nesta ação, se houver,
  "updatedNodes": um array opcional de objetos NetworkNode modificados por esta ação (se o status ou serviços mudaram). Mantenha o formato padrão de NetworkNode.
}
`;

    const prompt = `
Comando digitado pelo usuário: "${command}"

Estado atual do Cenário:
- Título da Missão: ${mission.title}
- Briefing da Missão: ${mission.briefing}

Passos da Missão:
${JSON.stringify(steps)}

Topologia de Rede Atual:
${JSON.stringify(nodes)}

Histórico de comandos recentes do terminal:
${JSON.stringify(history?.slice(-5))}

Por favor, gere a resposta do console de forma extremamente imersiva e decida se algum passo foi cumprido.
`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            output: {
              type: Type.STRING,
              description: "A saída de console gerada em formato de texto cru (estilo terminal Linux). Use novas linhas com \\n.",
            },
            stepCompletedId: {
              type: Type.INTEGER,
              description: "O ID numérico do passo da missão que este comando concluiu, ou null se nenhum passo foi concluído.",
            },
            updatedNodes: {
              type: Type.ARRAY,
              description: "Array de nós de rede cujos estados de segurança ou serviços mudaram devido a este comando (opcional).",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  ip: { type: Type.STRING },
                  role: { type: Type.STRING },
                  status: { type: Type.STRING, description: "secure, compromised, scanned, offline" },
                  os: { type: Type.STRING },
                  services: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "status"],
              },
            },
          },
          required: ["output"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Erro no terminal AI:", error);
    res.status(500).json({
      output: `[SISTEMA ERROR] Falha ao contatar o simulador de IA: ${error?.message || error}\n`,
      stepCompletedId: null,
    });
  }
});

// Endpoint 2: Mentor de Cibersegurança para dúvidas e dicas
app.post("/api/gemini/mentor", async (req, res) => {
  try {
    const { messages, activeMission } = req.body;

    const systemInstruction = `
Você é o Mentor IA de Cyber Security. Seu papel é guiar alunos que estão aprendendo segurança da informação, hacking ético e defesa de redes.
Suas respostas devem ser educativas, profissionais, seguras e em português.

DIRETRIZES:
1. Nunca dê comandos ou códigos maliciosos prontos para serem usados em cenários reais reais externos. Foque estritamente em conceitos educativos e no cenário de simulação atual.
2. Explique detalhadamente os conceitos envolvidos (como SQL Injection, CSRF, DDoS, Port Scanning, Privilege Escalation).
3. Se o aluno estiver em uma missão ativa ("${activeMission?.title || "Nenhuma"}"), dê dicas sutis e construtivas em vez de apenas revelar a resposta completa de bandeja, estimulando o raciocínio.
4. Use formatação Markdown elegante para facilitar a leitura.
`;

    // Converte histórico de mensagens para o formato do prompt
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
      },
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Erro no mentor IA:", error);
    res.status(500).json({ error: "Erro ao gerar resposta do Mentor IA." });
  }
});

// Endpoint 3: Analisar código corrigido (Defesa/Patch)
app.post("/api/gemini/analyze-patch", async (req, res) => {
  try {
    const { filePath, fileContent, briefing, vulnerabilityDescription } = req.body;

    const systemInstruction = `
Você é um auditor sênior de segurança de código (DevSecOps).
O usuário submeteu uma correção (patch) de código para sanar uma vulnerabilidade específica.
Seu dever é analisar se o código corrigido é realmente SEGURO e resolve o problema reportado, sem introduzir novas falhas básicas.

Vulnerabilidade a corrigir: ${vulnerabilityDescription}
Contexto do Sistema: ${briefing}

Você deve verificar se:
1. O código foi corrigido adequadamente (por exemplo, usando queries parametrizadas em vez de concatenação no caso de SQLi; adicionando validação de input; usando hashes seguros em vez de MD5; sanitizando HTML contra XSS; etc.).
2. O patch está completo e não quebra a funcionalidade básica do script.

A resposta deve ser obrigatoriamente um objeto JSON contendo:
{
  "approved": boolean (true se o patch resolveu a falha com segurança, false caso contrário),
  "feedback": "Análise técnica detalhada em português, explicando o que foi feito corretamente e sugerindo melhorias caso necessário. Use formatação Markdown."
}
`;

    const prompt = `
Arquivo que foi modificado: ${filePath}

Código Atualizado Enviado pelo Usuário:
\`\`\`
${fileContent}
\`\`\`

Por favor, forneça sua auditoria técnica de segurança sobre este patch de código.
`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            approved: {
              type: Type.BOOLEAN,
              description: "Indica se a correção de segurança foi aceita e resolve a vulnerabilidade de forma robusta.",
            },
            feedback: {
              type: Type.STRING,
              description: "Auditoria e revisão detalhada do código em português com formatação Markdown.",
            },
          },
          required: ["approved", "feedback"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Erro ao analisar patch de código:", error);
    res.status(500).json({
      approved: false,
      feedback: `⚠️ Falha ao auditar o código com IA: ${error?.message || error}`,
    });
  }
});

// Endpoint 4: Criar cenário de estudo personalizado por IA
app.post("/api/gemini/generate-scenario", async (req, res) => {
  try {
    const { userPrompt } = req.body;

    const systemInstruction = `
Você é o Arquiteto de Cenários de Hacking da IA.
O usuário quer que você gere um desafio / missão de cibersegurança prático e personalizado baseado em uma ideia livre descrita por ele.

Você deve criar um cenário estruturado e educacional com os seguintes campos:
- ID único (gerado de forma aleatória ou sequencial ex: 'custom-iot-hack')
- Título cativante e descritivo
- Nível de Dificuldade: 'Iniciante', 'Intermediário' ou 'Avançado'
- Categoria: 'Ataque (Pentest)' ou 'Defesa (Blue Team)' ou 'Análise de Código'
- Descrição curta do objetivo principal
- Briefing detalhado simulando uma situação real de empresa ou infraestrutura crítica
- Steps (Passos da Missão): Uma lista de 3 ou 4 passos sequenciais que guiarão o aluno. Cada passo deve ter:
  - id (inteiro de 1 a 4)
  - title (título curto do passo)
  - instruction (instrução clara de como realizar)
  - hint (uma dica caso ele trave)
  - triggerCommand (um comando chave, termo, ferramenta ou exploit que serve de resposta lógica para completar o passo, ex: 'nmap', 'sqlmap', 'hydra', 'nc', 'iptables', 'auth_token', 'patch')
- Network Nodes (Nós de rede simulados para a topologia): de 3 a 5 servidores/máquinas envolvidas. Cada nó possui:
  - id (ex: 'gateway', 'dmz-web', 'db-internal')
  - label (ex: 'Provedor de Borda', 'Servidor Web Público', 'Banco de Dados Interno')
  - ip (ex: '10.0.0.1', '10.0.0.10', '10.0.0.25')
  - role (ex: 'gateway', 'webserver', 'database', 'workstation', 'attacker')
  - status (padrão 'secure' ou 'compromised', dependendo do cenário inicial)
  - os (sistema operacional ex: 'Ubuntu Server 22.04', 'Alpine OS', 'Windows Server 2019')
  - services (lista de serviços ativos ex: ['Nginx 1.24', 'SSH OpenSSH 8.9p1', 'MySQL 8.0'])
- VulnerableFiles (opcional): se a categoria for Análise de Código ou Defesa, inclua 1 arquivo vulnerável que o usuário precisa revisar e corrigir.

REGRAS:
- Todas as descrições, briefings e feedbacks devem ser escritos em português de Portugal ou do Brasil de forma clara e profissional.
- O cenário deve ser lúdico, prático e focado no aprendizado prático da rede.
`;

    const prompt = `Crie um desafio prático de cibersegurança focado nesta ideia do usuário: "${userPrompt}"`;

    const response = await generateContentWithRetry({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            difficulty: { type: Type.STRING, description: "Iniciante, Intermediário ou Avançado" },
            category: { type: Type.STRING, description: "Ataque (Pentest), Defesa (Blue Team), Análise de Código ou Personalizado por IA" },
            description: { type: Type.STRING },
            briefing: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  instruction: { type: Type.STRING },
                  hint: { type: Type.STRING },
                  triggerCommand: { type: Type.STRING, description: "O comando técnico ou palavra-chave que valida o passo." },
                },
                required: ["id", "title", "instruction", "hint", "triggerCommand"],
              },
            },
            networkNodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  ip: { type: Type.STRING },
                  role: { type: Type.STRING },
                  status: { type: Type.STRING, description: "secure, compromised, scanned, offline" },
                  os: { type: Type.STRING },
                  services: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["id", "label", "ip", "role", "status", "os", "services"],
              },
            },
            vulnerableFiles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING },
                  language: { type: Type.STRING },
                  initialContent: { type: Type.STRING },
                  currentContent: { type: Type.STRING },
                  vulnerabilityDescription: { type: Type.STRING },
                  solutionExplanation: { type: Type.STRING },
                },
                required: ["path", "language", "initialContent", "currentContent", "vulnerabilityDescription", "solutionExplanation"],
              },
            },
          },
          required: ["id", "title", "difficulty", "category", "description", "briefing", "steps", "networkNodes"],
        },
      },
    });

    const missionData = JSON.parse(response.text || "{}");
    // Garante que o currentContent inicie igual ao initialContent se não especificado
    if (missionData.vulnerableFiles) {
      missionData.vulnerableFiles = missionData.vulnerableFiles.map((vf: any) => ({
        ...vf,
        currentContent: vf.initialContent,
      }));
    }

    res.json(missionData);
  } catch (error: any) {
    console.error("Erro ao gerar cenário personalizado por IA:", error);
    res.status(500).json({ error: "Erro ao gerar cenário personalizado por IA: " + error?.message });
  }
});

// Setup Vite or Static File Server middleware
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CyberShield Server] Executando em http://localhost:${PORT}`);
  });
}

setupServer();
