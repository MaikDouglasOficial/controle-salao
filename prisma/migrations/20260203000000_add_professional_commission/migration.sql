-- Add commission percentage to Professional
ALTER TABLE "Professional" ADD COLUMN "commissionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0;
