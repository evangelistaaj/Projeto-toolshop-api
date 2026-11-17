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