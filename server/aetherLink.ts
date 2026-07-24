import fs from 'fs';
import { execFile } from 'child_process';
import WebSocket from 'ws';
import db from './db.js';
import { config } from './config.js';
import { runSecurityTests } from './security/runner.js';

// Definição das ações suportadas pelo Levy Gestor
const ACTIONS = [
  {
    name: "rodar_teste_seguranca",
    description: "Dispara a suíte de testes de segurança (pentest automatizado) do Scaffl e retorna um resumo com total/aprovados/falhas/avisos e o ID do run.",
    params: {}
  },
  {
    name: "ultimo_resultado_seguranca",
    description: "Retorna os resultados do run de teste de segurança mais recente (ou de um runId específico), incluindo todas as falhas e avisos com detalhes.",
    params: { runId: "string (opcional, UUID de um run específico; se omitido usa o mais recente)" }
  },
  {
    name: "status_servidor",
    description: "Retorna status operacional do servidor: uptime, modo de deployment, versão do Node, uso de memória, conectividade com o banco.",
    params: {}
  },
  {
    name: "resumo_cotas",
    description: "Retorna um resumo AGREGADO (não por usuário) de consumo de cotas: créditos do Levy consumidos essa semana por todos os usuários, requisições do Lab hoje e essa semana, e contagem de eventos de rate-limit/limite atingido. Nunca inclui dados individuais de um usuário específico.",
    params: {}
  },
  {
    name: "ver_logs",
    description: "Retorna as últimas N linhas (padrão 100) do log do processo do servidor.",
    params: { linhas: "integer (opcional, padrão 100)" }
  },
  {
    name: "reiniciar",
    description: "Reinicia o processo do servidor via pm2.",
    params: {}
  }
];

// Central action executor, wrapped with try/catch inside startAetherLink handlers
async function executeAction(action: string, params: any): Promise<string> {
  switch (action) {
    case 'rodar_teste_seguranca': {
      const { runId, results } = await runSecurityTests();
      const passed = results.filter(r => r.status === 'pass').length;
      const failed = results.filter(r => r.status === 'fail').length;
      const warnings = results.filter(r => r.status === 'warn').length;
      const errors = results.filter(r => r.status === 'error').length;
      
      let msg = `Run ${runId} concluído: ${results.length} testes, ${passed} aprovados, ${failed} falharam, ${warnings + errors} avisos.`;
      const failures = results.filter(r => r.status === 'fail');
      if (failures.length > 0) {
        msg += "\n\nFalhas:\n" + failures.map(f => `- ${f.name} (${f.severity.toUpperCase()}): ${f.message}`).join("\n");
      }
      return msg;
    }

    case 'ultimo_resultado_seguranca': {
      const runId = params?.runId;
      let run: any;
      if (runId) {
        run = db.prepare('SELECT * FROM security_test_runs WHERE id = ?').get(runId);
      } else {
        run = db.prepare('SELECT * FROM security_test_runs ORDER BY createdAt DESC LIMIT 1').get();
      }
      if (!run) {
        return "Nenhum run de teste de segurança encontrado.";
      }
      const results = db.prepare('SELECT * FROM security_test_results WHERE runId = ? ORDER BY severity ASC').all(run.id) as any[];
      
      let msg = `Resumo do Run: ${run.id}\n`;
      msg += `Data: ${run.createdAt}\n`;
      msg += `Total de testes: ${run.totalTests} (Aprovados: ${run.passed}, Falhas: ${run.failed}, Avisos: ${run.warnings}, Erros: ${run.errors})\n\n`;
      
      const nonPassed = results.filter(r => r.status !== 'pass');
      if (nonPassed.length === 0) {
        msg += "Todos os testes passaram com sucesso! (Nenhum aviso ou falha)";
      } else {
        msg += "Resultados não-aprovados:\n";
        for (const r of nonPassed) {
          msg += `- [${r.status.toUpperCase()}] ${r.name} (Severidade: ${r.severity})\n`;
          if (r.message) msg += `  Mensagem: ${r.message}\n`;
          if (r.details) msg += `  Detalhes: ${r.details}\n`;
        }
      }
      return msg;
    }

    case 'status_servidor': {
      let dbOk = false;
      try {
        db.prepare("SELECT 1").get();
        dbOk = true;
      } catch (e) {}
      
      const status = {
        uptime: process.uptime(),
        deploymentMode: config.deploymentMode,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        dbConnected: dbOk
      };
      return JSON.stringify(status, null, 2);
    }

    case 'resumo_cotas': {
      const levyCredits = db.prepare("SELECT SUM(credits) as total FROM quota_metrics WHERE surface = 'levy' AND ts >= datetime('now', '-7 days')").get() as { total: number | null };
      const labToday = db.prepare("SELECT COUNT(*) as count FROM quota_metrics WHERE surface = 'lab' AND event = 'request' AND ts >= datetime('now', '-24 hours')").get() as { count: number };
      const labWeek = db.prepare("SELECT COUNT(*) as count FROM quota_metrics WHERE surface = 'lab' AND event = 'request' AND ts >= datetime('now', '-7 days')").get() as { count: number };
      const rateLimitsWeek = db.prepare("SELECT COUNT(*) as count FROM quota_metrics WHERE event IN ('429', 'limit_hit') AND ts >= datetime('now', '-7 days')").get() as { count: number };

      const levyTotal = levyCredits?.total || 0;
      const labTodayCount = labToday?.count || 0;
      const labWeekCount = labWeek?.count || 0;
      const rateLimitsCount = rateLimitsWeek?.count || 0;
      
      return [
        "Resumo de consumo de cotas (Agregado):",
        `- Créditos do Levy consumidos nos últimos 7 dias: ${levyTotal}`,
        `- Requisições do Lab nas últimas 24h: ${labTodayCount}`,
        `- Requisições do Lab nos últimos 7 dias: ${labWeekCount}`,
        `- Eventos de limite atingido/rate-limit (429) nos últimos 7 dias: ${rateLimitsCount}`
      ].join("\n");
    }

    case 'ver_logs': {
      const logPath = process.env.AETHER_LINK_LOG_PATH;
      if (!logPath) {
        return "[ERRO] AETHER_LINK_LOG_PATH não configurada — defina o caminho do arquivo de log no .env.";
      }
      try {
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const limit = (params && typeof params.linhas === 'number') ? params.linhas : 100;
        const lastLines = lines.slice(-limit);
        return lastLines.join('\n');
      } catch (e: any) {
        return `[ERRO] Falha ao ler arquivo de log: ${e.message}`;
      }
    }

    case 'reiniciar': {
      const pm2Name = process.env.AETHER_LINK_PM2_NAME;
      if (!pm2Name) {
        return "[ERRO] AETHER_LINK_PM2_NAME não configurada — defina o nome do processo pm2 no .env.";
      }
      execFile('pm2', ['restart', pm2Name], (error) => {
        if (error) {
          console.error(`[aether-link] Falha ao reiniciar pm2: ${error.message}`);
        }
      });
      return `Comando de restart enviado para o processo ${pm2Name}.`;
    }

    default:
      return `[ERRO] ação desconhecida: ${action}`;
  }
}

export function startAetherLink(): void {
  const token = process.env.AETHER_LINK_TOKEN;
  if (!token) {
    console.log('[aether-link] Aether Link desabilitado (AETHER_LINK_TOKEN não configurado).');
    return;
  }

  // Porta e endereço confirmados direto no backend do AetherOS (uvicorn escuta em
  // :8000 — 8001 é a porta do ChromaDB, não da API). Vale só quando Scaffl roda na
  // mesma VPS que o AetherOS, com o container em network_mode: host.
  const url = process.env.AETHER_LINK_URL || 'ws://127.0.0.1:8000/ws/projects';

  function connect() {
    console.log(`[aether-link] Conectando a ${url}...`);
    const ws = new WebSocket(url);

    ws.on('open', () => {
      try {
        const helloMsg = {
          type: 'hello',
          token: token,
          name: 'Scaffl',
          description: 'Plataforma educacional Scaffl — Levy (chat de suporte), Lab de simuladores, testes de segurança.',
          actions: ACTIONS
        };
        ws.send(JSON.stringify(helloMsg));
        console.log('[aether-link] Conectado e hello enviado com sucesso.');
      } catch (e: any) {
        console.error('[aether-link] Erro ao enviar mensagem de hello:', e.message);
      }
    });

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'invoke') {
          const actionName = data.action;
          const requestId = data.request_id;
          const params = data.params || {};

          let result: string;
          try {
            const rawResult = await executeAction(actionName, params);
            result = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
          } catch (err: any) {
            result = `[ERRO] ${err.message}`;
          }

          const responseMsg = {
            type: 'invoke_result',
            request_id: requestId,
            result: result
          };
          ws.send(JSON.stringify(responseMsg));
        }
      } catch (err: any) {
        console.error('[aether-link] Erro ao processar mensagem recebida:', err.message);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[aether-link] Desconectado (${code}: ${reason.toString()}) — reconectando em 5s`);
      setTimeout(connect, 5000);
    });

    ws.on('error', (err) => {
      console.error('[aether-link] Erro na conexão:', err.message);
    });
  }

  connect();
}
