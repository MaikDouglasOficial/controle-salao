import { prisma } from '@/lib/prisma';

const MIN_CODE = 1000;

/**
 * Retorna o próximo código numérico (1000, 1001, 1002...) único entre produtos e serviços.
 */
export async function getNextSku(): Promise<string> {
  const [products, services] = await Promise.all([
    prisma.product.findMany({ where: { sku: { not: null } }, select: { sku: true } }),
    prisma.service.findMany({ where: { sku: { not: null } }, select: { sku: true } }),
  ]);
  const allSkus = [...products.map((p) => p.sku), ...services.map((s) => s.sku)].filter(
    (s): s is string => typeof s === 'string' && /^\d+$/.test(s)
  );
  const maxNum = allSkus.length ? Math.max(...allSkus.map((s) => parseInt(s, 10))) : MIN_CODE - 1;
  const next = Math.max(MIN_CODE, maxNum + 1);
  return String(next);
}
