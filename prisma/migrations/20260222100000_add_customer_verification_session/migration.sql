-- CreateTable
CREATE TABLE "CustomerVerificationSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerVerificationSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CustomerVerificationSession_customerId_idx" ON "CustomerVerificationSession"("customerId");
CREATE INDEX "CustomerVerificationSession_expiresAt_idx" ON "CustomerVerificationSession"("expiresAt");
