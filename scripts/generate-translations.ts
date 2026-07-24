// Gera as traduções en/es a partir dos dicionários-fonte em client/src/locales/pt/*.json,
// usando a API do Gemini (chave free, mesmo caminho já provado em server/labAI.ts).
//
// Rodar manualmente quando um namespace ganhar chave nova — NÃO faz parte do build/dev:
//   npx tsx scripts/generate-translations.ts [namespace opcional]
//
// Nunca escreve um arquivo de saída se o conjunto de chaves não bater exatamente com a fonte.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const PT_DIR = path.join(ROOT, 'client/src/locales/pt');
const TARGET_LOCALES: Record<string, string> = { en: 'English', es: 'español' };

function loadEnvKey(name: string): string {
  const line = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').find(l => l.startsWith(name + '='));
  if (!line) throw new Error(`${name} não encontrado no .env`);
  return line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
}

async function translateNamespace(namespace: string, sourceDict: Record<string, string>, targetLabel: string): Promise<Record<string, string>> {
  const key = process.env.GEMINI_FREE_KEY?.trim() || loadEnvKey('GEMINI_FREE_KEY');
  const prompt = `Traduza os VALORES deste objeto JSON de português (Brasil) para ${targetLabel}, mantendo as CHAVES exatamente iguais. Preserve qualquer token de interpolação como {nome} sem traduzir o que está dentro das chaves. Preserve formatação Markdown (**negrito**, links, etc). Responda APENAS com o objeto JSON traduzido, sem comentários, sem bloco de código markdown.

${JSON.stringify(sourceDict, null, 2)}`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
  });
  const json = await res.json() as any;
  if (!res.ok) throw new Error(`Gemini error (${namespace}): ${json?.error?.message ?? res.status}`);

  const text: string = json.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
  const match = text.match(/```json([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const raw = match ? (match[1] ?? match[0]) : text;

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw.trim());
  } catch (e) {
    throw new Error(`Resposta do Gemini não é JSON válido para ${namespace}: ${(e as Error).message}\n${text.slice(0, 500)}`);
  }

  const sourceKeys = Object.keys(sourceDict).sort();
  const gotKeys = Object.keys(parsed).sort();
  if (JSON.stringify(sourceKeys) !== JSON.stringify(gotKeys)) {
    throw new Error(`Conjunto de chaves não bate em ${namespace}: esperado ${sourceKeys.join(',')} — recebido ${gotKeys.join(',')}`);
  }

  return parsed;
}

async function main() {
  const filterNamespace = process.argv[2];
  const files = fs.readdirSync(PT_DIR).filter(f => f.endsWith('.json') && (!filterNamespace || f === `${filterNamespace}.json`));

  if (files.length === 0) {
    console.log(filterNamespace ? `Namespace "${filterNamespace}" não encontrado em ${PT_DIR}` : `Nenhum namespace encontrado em ${PT_DIR}`);
    return;
  }

  for (const file of files) {
    const namespace = file.replace(/\.json$/, '');
    const sourceDict = JSON.parse(fs.readFileSync(path.join(PT_DIR, file), 'utf8'));

    for (const [locale, label] of Object.entries(TARGET_LOCALES)) {
      process.stdout.write(`[i18n] ${namespace} → ${locale}... `);
      try {
        const translated = await translateNamespace(namespace, sourceDict, label);
        const outDir = path.join(ROOT, 'client/src/locales', locale);
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, file), JSON.stringify(translated, null, 2) + '\n');
        console.log('ok');
      } catch (err) {
        console.log('FALHOU');
        console.error(`  ${(err as Error).message}`);
      }
      await new Promise(r => setTimeout(r, 500)); // respeita RPM do tier free
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
