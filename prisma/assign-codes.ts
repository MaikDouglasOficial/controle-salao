/**
 * Script one-time: atribui códigos 1000, 1001, 1002... a produtos e serviços
 * que ainda não possuem código numérico (sem sku ou sku no formato antigo).
 *
 * Uso: npx ts-node -P tsconfig.seed.json prisma/assign-codes.ts
 */
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIN_CODE = 1000;

function getNextNumericCode(usedCodes: number[]): number {
  const max = usedCodes.length ? Math.max(...usedCodes) : MIN_CODE - 1;
  return Math.max(MIN_CODE, max + 1);
}

function isNumericSku(sku: string | null): boolean {
  return typeof sku === 'string' && /^\d+$/.test(sku);
}

async function main() {
  const usedCodes: number[] = [];

  const [allProducts, allServices] = await Promise.all([
    prisma.product.findMany({ select: { sku: true } }),
    prisma.service.findMany({ select: { sku: true } }),
  ]);
  [...allProducts, ...allServices].forEach((r) => {
    if (isNumericSku(r.sku)) usedCodes.push(parseInt(r.sku!, 10));
  });

  const [products, services] = await Promise.all([
    prisma.product.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true, sku: true } }),
    prisma.service.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true, sku: true } }),
  ]);

  const toAssignProducts = products.filter((p) => !isNumericSku(p.sku));
  const toAssignServices = services.filter((s) => !isNumericSku(s.sku));

  let updated = 0;
  for (const p of toAssignProducts) {
    const code = getNextNumericCode(usedCodes);
    usedCodes.push(code);
    await prisma.product.update({ where: { id: p.id }, data: { sku: String(code) } });
    console.log(`Produto #${p.id} "${p.name}" → ${code}`);
    updated++;
  }
  for (const s of toAssignServices) {
    const code = getNextNumericCode(usedCodes);
    usedCodes.push(code);
    await prisma.service.update({ where: { id: s.id }, data: { sku: String(code) } });
    console.log(`Serviço #${s.id} "${s.name}" → ${code}`);
    updated++;
  }
  console.log(`\nConcluído: ${updated} registro(s) atualizado(s) com código.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
