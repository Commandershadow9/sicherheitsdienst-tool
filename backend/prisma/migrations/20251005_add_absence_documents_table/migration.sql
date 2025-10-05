-- Abwesenheitsdokumente Tabelle (nachträglich rekonstruiert)
CREATE TABLE "absence_documents" (
  "id" TEXT PRIMARY KEY,
  "absence_id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "stored_at" TEXT NOT NULL,
  "uploaded_by" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE "absence_documents"
  ADD CONSTRAINT "absence_documents_absence_id_fkey"
  FOREIGN KEY ("absence_id")
  REFERENCES "absences"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE INDEX "absence_documents_absence_idx" ON "absence_documents"("absence_id");

-- Prisma erwartet einen updated_at Trigger nur für Tabellen mit @updatedAt, hier nicht nötig
