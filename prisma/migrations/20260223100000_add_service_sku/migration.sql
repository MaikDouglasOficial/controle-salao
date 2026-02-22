-- AlterTable (Service): código SKU único para busca no PDV
ALTER TABLE "Service" ADD COLUMN "sku" TEXT;
CREATE UNIQUE INDEX "Service_sku_key" ON "Service"("sku");
