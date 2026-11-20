import { createHmac } from 'node:crypto';

// Códigos de verificação em dois passos (TOTP, RFC 6238), como os de uma app de
// autenticação: HMAC-SHA1 do número de períodos de 30 s desde 1970, com o segredo
// que a Toolshop devolve em base32.

function deBase32(texto: string): Buffer {
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const letra of texto.replace(/=+$/, '').toUpperCase()) {
    const valor = alfabeto.indexOf(letra);
    if (valor < 0) throw new Error(`Segredo TOTP com um carácter que não é base32: "${letra}"`);
    bits += valor.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function codigoTotp(segredoBase32: string, momento = Date.now(), digitos = 6): string {
  const periodo = Buffer.alloc(8);
  periodo.writeBigUInt64BE(BigInt(Math.floor(momento / 1000 / 30)));
  const hash = createHmac('sha1', deBase32(segredoBase32)).update(periodo).digest();
  const inicio = hash[hash.length - 1] & 0x0f;
  const numero = hash.readUInt32BE(inicio) & 0x7fffffff;
  return String(numero % 10 ** digitos).padStart(digitos, '0');
}
