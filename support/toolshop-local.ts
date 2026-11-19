import { execFileSync } from 'node:child_process';

// Contentor Docker da API da Toolshop local. Pode ser trocado com TOOLSHOP_CONTENTOR.
const CONTENTOR = process.env.TOOLSHOP_CONTENTOR ?? 'pst-laravel-api-1';

// Gera já o PDF de uma fatura, com o próprio código da Toolshop (o trabalho CreateInvoicePDF).
// Normalmente é o agendador que o pede, para todas as faturas sem PDF de uma vez; aqui pedimos
// só o desta fatura, para o cenário não depender da fila nem do agendador. Só na Toolshop local.
export function gerarPdfDaFatura(numero: string): void {
  // O número entra num comando: só aceitamos o formato de um número de fatura.
  if (!/^INV-\d+$/.test(numero)) {
    throw new Error(`Número de fatura inesperado: "${numero}"`);
  }
  execFileSync(
    'docker',
    ['exec', CONTENTOR, 'php', 'artisan', 'tinker', `--execute=App\\Jobs\\CreateInvoicePDF::dispatchSync('${numero}');`],
    { stdio: 'pipe', timeout: 60_000 },
  );
}

// O segredo com que a Toolshop local assina os tokens (configuração "jwt.secret").
// Serve para os cenários criarem tokens noutro momento do tempo. Nunca é escrito
// em registos nem em mensagens de erro. Só na Toolshop local.
export function segredoJwt(): string {
  const saida = execFileSync(
    'docker',
    ['exec', CONTENTOR, 'php', 'artisan', 'tinker', "--execute=echo config('jwt.secret');"],
    { stdio: 'pipe', timeout: 60_000 },
  ).toString();
  // O PHP do contentor escreve um aviso ("Module FFI is already loaded") antes do valor:
  // o segredo é a última linha com texto.
  const segredo = saida.split(/\r?\n/).map((linha) => linha.trim()).filter(Boolean).pop();
  if (!segredo || /warning/i.test(segredo)) {
    throw new Error('Não consegui ler o segredo dos tokens da Toolshop local (config jwt.secret).');
  }
  return segredo;
}
