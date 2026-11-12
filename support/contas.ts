// Contas de demonstração da Toolshop, criadas pelos dados iniciais
// (php artisan migrate:fresh --seed). As credenciais são públicas:
// aparecem na documentação da própria Toolshop.
// Podem ser trocadas por variáveis de ambiente, sem mexer no código.
export const contaCliente = {
  email: process.env.CLIENTE_EMAIL ?? 'customer2@practicesoftwaretesting.com',
  password: process.env.CLIENTE_PASSWORD ?? 'welcome01',
};

