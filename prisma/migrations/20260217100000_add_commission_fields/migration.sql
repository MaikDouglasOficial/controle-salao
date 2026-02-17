-- AlterTable (Service): comissão por tipo e valor
ALTER TABLE "Service" ADD COLUMN "commissionType" TEXT DEFAULT 'PERCENT';
ALTER TABLE "Service" ADD COLUMN "commissionValue" REAL NOT NULL DEFAULT 0;

-- AlterTable (Product): comissão por tipo e valor
ALTER TABLE "Product" ADD COLUMN "commissionType" TEXT DEFAULT 'PERCENT';
ALTER TABLE "Product" ADD COLUMN "commissionValue" REAL NOT NULL DEFAULT 0;

-- AlterTable (SaleItem): snapshot da comissão no momento da venda
ALTER TABLE "SaleItem" ADD COLUMN "commissionAmount" REAL NOT NULL DEFAULT 0;
