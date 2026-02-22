-- Tornar e-mail do cliente único (um cliente por e-mail)
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
