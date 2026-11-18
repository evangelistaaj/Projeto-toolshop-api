// Configuração comum a todos os perfis.
const comum = {
  paths: ['features/**/*.feature'],
  requireModule: ['tsx/cjs'],
  require: ['steps/**/*.ts', 'support/**/*.ts'],
};

module.exports = {
  // Execução normal: rápida, sem bugs conhecidos nem cenários lentos.
  default: { ...comum, tags: 'not @bug-conhecido and not @lento' },

  // Só os bugs conhecidos: para ver se já foram corrigidos.
  bugs: { ...comum, tags: '@bug-conhecido' },

  // Só os cenários lentos (esperam por processos em segundo plano).
  lento: { ...comum, tags: '@lento and not @bug-conhecido' },
};