import { World, setWorldConstructor } from '@cucumber/cucumber';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { DadosProduto } from './produtos';
import type { ProdutoDoCatalogo } from './catalogo';

// O "mundo" de cada cenário: o Cucumber cria um novo por cenário
// e entrega-o aos passos e hooks como `this`.
export class MundoToolshop extends World {
  // Cliente HTTP do Playwright. É criado no hook Before, porque a criação
  // é assíncrona e um construtor não pode esperar por ela.
  api!: APIRequestContext;

  // Última resposta recebida, para os passos "Então" a verificarem.
  resposta?: APIResponse;

  // Token de acesso, guardado depois de um login com sucesso.
  token?: string;

  // Email com que se fez login, para comparar com os dados da conta.
  emailLogin?: string;

  // Dados enviados na criação de um produto, para comparar com o que fica gravado.
  dadosEnviados?: DadosProduto;

  // Id do último produto criado no cenário.
  produtoId?: string;

  // Todos os produtos criados no cenário, para o hook After os apagar.
  produtosCriados: string[] = [];

  // Carrinho do cenário e o produto que lá foi posto.
  carrinhoId?: string;
  produtoNoCarrinhoId?: string;

  // Todos os carrinhos criados no cenário, para o hook After os apagar.
  carrinhosCriados: string[] = [];

  // Catálogo percorrido página a página: os ids recebidos e o total que a API indicou.
  produtosPercorridos: string[] = [];
  totalDoCatalogo?: number;

  // Pesquisa e filtros do catálogo: os produtos recebidos (todas as páginas), a regra que
  // cada um devia cumprir e se os alugueres contam (a pesquisa inclui-os; o catálogo não).
  produtosRecebidos: ProdutoDoCatalogo[] = [];
  filtro?: { descricao: string; cumpre: (p: ProdutoDoCatalogo) => boolean; comAlugueres: boolean };

  // Código postal da última pesquisa de morada, para comparar com a resposta.
  codigoPostalPesquisado?: string;

  // Compra: quantidade no carrinho, morada enviada e fatura criada.
  quantidadeNoCarrinho?: number;
  moradaDaFatura?: Record<string, string>;
  faturaId?: string;

  // Números das faturas criadas no cenário (para comparar a sequência).
  numerosDasFaturas?: string[];

  // Carrinho com vários produtos: o que se pôs no carrinho, para comparar
  // com a fatura e com o email de confirmação.
  produtosNoCarrinho?: { id: string; nome: string; preco: number; quantidade: number; co2: string }[];

  // Texto do email de confirmação da compra, depois de ter chegado.
  textoDoEmail?: string;

  // Dados do cartão com que se pagou a compra, para comparar com a fatura.
  cartaoDaCompra?: { numero: string; cvv: string };

  // Autorização: a fatura de outro cliente (e o token dele, para a consultar como dono)
  // e a fatura do próprio cliente do cenário.
  faturaDoOutroCliente?: { id: string; numero: string };
  tokenDoOutroCliente?: string;
  minhaFatura?: { id: string; numero: string };

  // Autorização: outro cliente, com conta criada no cenário (e apagada no fim), o token
  // dele e os dados com que se registou, para confirmar que nada mudou.
  outroCliente?: { id: string; token: string; dados: import('./clientes').DadosCliente };

  // Marcas e categorias: a que existe no cenário (para tentar alterá-la), o nome que se
  // tentou criar, e tudo o que ficou criado, para o hook After apagar com o administrador.
  marcaOuCategoria?: { endereco: string; id: string; nome: string; slug: string };
  nomeTentado?: string;
  registosCriados: { endereco: string; id: string }[] = [];

  // Password: a da conta antes de a mudar, o token dessa sessão e as respostas da
  // recuperação de password (para um email com conta e outro sem conta).
  passwordAntiga?: string;
  tokenAntigo?: string;
  respostasDaRecuperacao?: { comConta: { codigo: number; corpo: string }; semConta: { codigo: number; corpo: string } };

  // Verificação em dois passos (TOTP): o segredo da conta, para calcular os códigos.
  segredoTotp?: string;

  // Especificação de um produto, criada pelo administrador no cenário.
  especificacao?: { id: string; valor: string };
  nomeDaEspecificacaoTentada?: string;

  // Favoritos: o favorito do outro cliente.
  favoritoDoOutroCliente?: string;

  // Limpezas que só o dono pode fazer (ex.: o favorito do outro cliente), corridas no
  // hook After antes de apagar as contas.
  limpezas: (() => Promise<unknown>)[] = [];

  // Faturas recebidas numa lista ou pesquisa (número e dono), de todas as páginas.
  faturasRecebidas: { numero: string; dono: string }[] = [];

  // Preço do produto antes de uma tentativa de alteração, para confirmar que não mudou.
  precoOriginal?: number;

  // Registo: dados enviados e a conta criada (email e password, para fazer login).
  dadosDoRegisto?: import('./clientes').DadosCliente;
  contaRegistada?: { id: string; email: string; password: string };

  // Todas as contas registadas no cenário, para o hook After as apagar.
  clientesCriados: string[] = [];

}

setWorldConstructor(MundoToolshop);