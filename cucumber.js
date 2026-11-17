// Configuração comum a todos os perfis.
const comum = {
  paths: ['features/**/*.feature'],
  requireModule: ['tsx/cjs'],
  require: ['steps/**/*.ts', 'support/**/*.ts'],
};

module.exports = {
  // Execução normal: exclui os cenários que reproduzem bugs ainda por corrigir.
  default: { ...comum, tags: 'not @bug-conhecido' },

  // Só os bugs conhecidos: para ver se já foram corrigidos.
  bugs: { ...comum, tags: '@bug-conhecido' },
};