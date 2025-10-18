-- CreateEnum
CREATE TYPE "SiteDocumentCategory" AS ENUM ('DIENSTANWEISUNG', 'NOTFALLPLAN', 'VERTRAG', 'BRANDSCHUTZORDNUNG', 'HAUSORDNUNG', 'GRUNDRISS', 'SONSTIGES');

-- CreateTable
CREATE TABLE "site_documents" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "SiteDocumentCategory" NOT NULL,
    "filename" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,
    "previous_version_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_documents_site_id_category_idx" ON "site_documents"("site_id", "category");

-- CreateIndex
CREATE INDEX "site_documents_site_id_is_latest_idx" ON "site_documents"("site_id", "is_latest");

-- AddForeignKey
ALTER TABLE "site_documents" ADD CONSTRAINT "site_documents_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_documents" ADD CONSTRAINT "site_documents_previous_version_id_fkey" FOREIGN KEY ("previous_version_id") REFERENCES "site_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_documents" ADD CONSTRAINT "site_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
