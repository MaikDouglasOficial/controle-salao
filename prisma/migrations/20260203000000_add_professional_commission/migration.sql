-- Add commission percentage to Professional (SQLite: REAL)
ALTER TABLE "Professional" ADD COLUMN "commissionPercentage" REAL NOT NULL DEFAULT 0;
