import path from 'path';
import fs from 'fs';

export const DEFAULT_SETORES = [
  'Atendimento',
  'Conteúdo',
  'Criação',
  'Social',
  'Performance: CRM/Mídia/SEO',
  'Planejamento',
  'Projetos/Operações',
  'Tecnologia',
];

const SETORES_FILE_PRIMARY = path.join(process.cwd(), 'setores.json');
const SETORES_FILE_TMP = path.join('/tmp', 'setores.json');

function _getSetoresFile() {
  try {
    fs.accessSync(path.dirname(SETORES_FILE_PRIMARY), fs.constants.W_OK);
    return SETORES_FILE_PRIMARY;
  } catch {
    return SETORES_FILE_TMP;
  }
}

export function loadSetores(): string[] {
  for (const f of [SETORES_FILE_PRIMARY, SETORES_FILE_TMP]) {
    try {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      if (Array.isArray(data.setores) && data.setores.length) return data.setores;
    } catch {}
  }
  return [...DEFAULT_SETORES];
}

export function saveSetores(list: string[]) {
  const file = _getSetoresFile();
  try {
    fs.writeFileSync(file, JSON.stringify({ setores: list }, null, 2));
  } catch (e: any) {
    console.error('saveSetores error:', e.message);
    throw new Error('Nao foi possivel salvar os setores. Verifique as permissoes do sistema de arquivos.');
  }
}
