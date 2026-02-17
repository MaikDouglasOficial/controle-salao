-- CreateTable
CREATE TABLE "SalePayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "saleId" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "installments" INTEGER,
    "installmentValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("saleId") REFERENCES "Sale" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
