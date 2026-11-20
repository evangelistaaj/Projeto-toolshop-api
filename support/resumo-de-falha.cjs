// Transforma a mensagem de erro de um passo (Playwright "expect" ou um Error normal)
// num resumo curto e legível: sem as linhas da pilha ("at ... node_modules ..."), sem a
// assinatura do matcher, sem repetições e com as linhas muito longas cortadas.
// Função pura, sem dependências: testada em testes/unitarios/resumo-de-falha.test.ts.

const ANSI = /\u001b\[[0-9;]*m/g;
const LARGURA = 160;

function resumoDaFalha(mensagem) {
  const linhas = String(mensagem ?? '').replace(ANSI, '').split(/\r?\n/);
  const fimDaPilha = linhas.findIndex((l) => /^\s+at /.test(l));
  const uteis = (fimDaPilha >= 0 ? linhas.slice(0, fimDaPilha) : linhas)
    .map((l) => l.replace(/\s+$/, ''))
    .map((l) => l.replace(/^(\s*)Error: /, '$1'))
    .filter((l) => !/^\s*expect\(.*\)\.\w+\(.*\)/.test(l)) // ex.: expect(received).toBe(expected) // Object.is equality
    .filter((l) => !/^\s*Call Log:\s*$/.test(l))
    .map((l) => (l.length > LARGURA ? `${l.slice(0, LARGURA - 1)}…` : l));

  // Sem linhas em branco seguidas e sem a mesma linha repetida (o Playwright repete a
  // mensagem personalizada nalguns casos, por exemplo nos tempos esgotados).
  const resultado = [];
  for (const linha of uteis) {
    if (linha.trim() === '' && (resultado.length === 0 || resultado[resultado.length - 1].trim() === '')) continue;
    if (linha.trim() !== '' && resultado.some((r) => r.trim() === linha.trim())) continue;
    resultado.push(linha);
  }
  while (resultado.length && resultado[resultado.length - 1].trim() === '') resultado.pop();
  return resultado;
}

module.exports = { resumoDaFalha };
