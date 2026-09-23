-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('ALLOW', 'CHALLENGE', 'DENY');

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "country" TEXT,
    "login_success" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "decision" "Decision" NOT NULL,
    "reasons" TEXT[],
    "rule_results" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "risk_assessments_created_at_idx" ON "risk_assessments"("created_at");

-- CreateIndex
CREATE INDEX "risk_assessments_user_id_created_at_idx" ON "risk_assessments"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "user_devices"("user_id", "device_id");
