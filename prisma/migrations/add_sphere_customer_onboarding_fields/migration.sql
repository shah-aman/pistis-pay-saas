-- AlterTable
ALTER TABLE "merchants" ADD COLUMN "sphere_customer_id" TEXT,
ADD COLUMN "kyc_status" TEXT DEFAULT 'pending',
ADD COLUMN "tos_accepted_at" TIMESTAMP(3),
ADD COLUMN "sphere_bank_account_id" TEXT,
ADD COLUMN "address_line1" TEXT,
ADD COLUMN "address_line2" TEXT,
ADD COLUMN "address_city" TEXT,
ADD COLUMN "address_postal_code" TEXT,
ADD COLUMN "address_state" TEXT,
ADD COLUMN "address_country" TEXT,
ADD COLUMN "phone_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "merchants_sphere_customer_id_key" ON "merchants"("sphere_customer_id");


