-- CreateTable (implicit many-to-many: Professional <-> Service)
-- SQLite
CREATE TABLE "_ProfessionalToService" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    FOREIGN KEY ("A") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("B") REFERENCES "Service" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "_ProfessionalToService_AB_unique" ON "_ProfessionalToService"("A", "B");
CREATE INDEX "_ProfessionalToService_B_index" ON "_ProfessionalToService"("B");
