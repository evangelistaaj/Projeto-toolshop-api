// Formatter do Cucumber para o terminal: um sinal por cenário enquanto corre (· passou,
// F falhou) e, no fim, cada falha num bloco curto: cenário, ficheiro e linha, o passo que
// falhou e o erro sem a pilha de linhas do node_modules. O relatório HTML continua completo.
// Usado em cucumber.js (format), no lugar do "progress".

const { Formatter, formatterHelpers, Status } = require('@cucumber/cucumber');
const { resumoDaFalha } = require('./resumo-de-falha.cjs');

class FormatadorLimpo extends Formatter {
  static documentation = 'Terminal limpo: um sinal por cenário e falhas curtas no fim.';

  constructor(options) {
    super(options);
    this.inicio = Date.now();
    this.sinais = 0;
    options.eventBroadcaster.on('envelope', (envelope) => {
      if (envelope.testCaseFinished && !envelope.testCaseFinished.willBeRetried) {
        this.sinal(envelope.testCaseFinished.testCaseStartedId);
      }
      if (envelope.testRunFinished) this.resumo();
    });
  }

  tentativas() {
    return this.eventDataCollector.getTestCaseAttempts().filter((t) => !t.willBeRetried);
  }

  sinal(testCaseStartedId) {
    const estado = this.eventDataCollector.getTestCaseAttempt(testCaseStartedId).worstTestStepResult.status;
    const falhou = estado === Status.FAILED || estado === Status.AMBIGUOUS || estado === Status.UNDEFINED;
    this.log(this.colorFns.forStatus(falhou ? Status.FAILED : Status.PASSED)(falhou ? 'F' : '·'));
    if (++this.sinais % 80 === 0) this.log('\n');
  }

  resumo() {
    const todas = this.tentativas();
    const estadoDe = (t) => t.worstTestStepResult.status;
    const falhas = todas.filter((t) => [Status.FAILED, Status.AMBIGUOUS, Status.UNDEFINED].includes(estadoDe(t)));
    const passaram = todas.filter((t) => estadoDe(t) === Status.PASSED).length;
    const outros = todas.length - passaram - falhas.length;
    const vermelho = this.colorFns.forStatus(Status.FAILED);
    const verde = this.colorFns.forStatus(Status.PASSED);

    this.log('\n\n');
    falhas.forEach((tentativa, i) => {
      const { testCase, testSteps } = formatterHelpers.parseTestCaseAttempt({
        testCaseAttempt: tentativa,
        snippetBuilder: this.snippetBuilder,
        supportCodeLibrary: this.supportCodeLibrary,
      });
      const passo = testSteps.find((p) => p.result.status !== Status.PASSED && p.result.status !== Status.SKIPPED);
      this.log(vermelho(`✗ ${i + 1}) ${testCase.name}`) + '\n');
      this.log(`     ${testCase.sourceLocation.uri}:${testCase.sourceLocation.line}\n`);
      if (passo) {
        this.log(`     Passo: ${passo.keyword ?? ''}${passo.text ?? '(hook)'}\n`);
        if (passo.result.status === Status.UNDEFINED) this.log('     O passo não está definido.\n');
        for (const linha of resumoDaFalha(passo.result.message)) this.log(linha.trim() ? `     ${linha}\n` : '\n');
      }
      this.log('\n');
    });

    const segundos = ((Date.now() - this.inicio) / 1000).toFixed(1).replace('.', ',');
    const partes = [verde(`✓ ${passaram} a passar`), (falhas.length ? vermelho : (t) => t)(`✗ ${falhas.length} a falhar`)];
    if (outros) partes.push(`${outros} por correr`);
    this.log(`${partes.join('   ')}   (${segundos} s)\n`);
  }
}

module.exports = FormatadorLimpo;
