// Divisão política oficial da Argentina: 23 províncias e a Cidade Autónoma
// de Buenos Aires. São dados públicos e estáveis, por isso podem viver no código.
export const PROVINCIAS_ARGENTINA = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires',
  'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
  'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

// Normaliza um texto para comparação: sem acentos, sem espaços nas pontas
// e em minúsculas. Assim, "Córdoba", "Cordoba" e "córdoba " contam como iguais.
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

// Países usados nos cenários e o código ISO que a API espera.
// Os cenários falam em "Portugal"; a API recebe "PT".
const PAISES: Record<string, string> = {
  Portugal: 'PT',
  Alemanha: 'DE',
  Espanha: 'ES',
  Brasil: 'BR',
  'França': 'FR',
  'Reino Unido': 'GB',
  Argentina: 'AR',
};

// Código ISO de um país. Um nome desconhecido faz falhar o teste,
// em vez de enviar à API um valor inventado.
export function codigoDoPais(nome: string): string {
  const codigo = PAISES[nome];
  if (!codigo) {
    throw new Error(`O país "${nome}" não tem código definido em support/referencia.ts`);
  }
  return codigo;
}