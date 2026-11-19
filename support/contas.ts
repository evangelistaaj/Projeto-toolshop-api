// Contas usadas nos cenários: um cliente e um administrador.
// Por omissão, são as que a Toolshop cria com os dados iniciais
// (php artisan migrate:fresh --seed), com as credenciais da documentação dela.
// Para usar outras contas, basta definir as variáveis de ambiente, sem mexer no código.
export const contaCliente = {
  email: process.env.CLIENTE_EMAIL ?? 'customer2@practicesoftwaretesting.com',
  password: process.env.CLIENTE_PASSWORD ?? 'welcome01',
};

export const contaAdmin = {
  email: process.env.ADMIN_EMAIL ?? 'admin@practicesoftwaretesting.com',
  password: process.env.ADMIN_PASSWORD ?? 'welcome01',
};

