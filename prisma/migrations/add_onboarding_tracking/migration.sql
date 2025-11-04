-- AlterTable
ALTER TABLE "merchants" 
ADD COLUMN "onboarding_completed" BOOLEAN DEFAULT false,
ADD COLUMN "onboarding_completed_at" TIMESTAMP(3),
ADD COLUMN "onboarding_skipped_at" TIMESTAMP(3);


