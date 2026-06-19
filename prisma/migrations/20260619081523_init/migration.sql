-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('email', 'sms', 'push', 'messenger');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EU', 'US', 'UK', 'APAC', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('transactional', 'marketing');

-- CreateEnum
CREATE TYPE "PolicyEffect" AS ENUM ('allow', 'deny');

-- CreateTable
CREATE TABLE "notification_types" (
    "type" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "suppressible_in_quiet_hours" BOOLEAN NOT NULL,
    "description" TEXT,

    CONSTRAINT "notification_types_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "default_preferences" (
    "notification_type" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,

    CONSTRAINT "default_preferences_pkey" PRIMARY KEY ("notification_type","channel")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "quiet_start" TEXT,
    "quiet_end" TEXT,
    "quiet_timezone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preference_overrides" (
    "user_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preference_overrides_pkey" PRIMARY KEY ("user_id","notification_type","channel")
);

-- CreateTable
CREATE TABLE "global_policies" (
    "id" UUID NOT NULL,
    "effect" "PolicyEffect" NOT NULL DEFAULT 'deny',
    "notification_type" TEXT,
    "channel" "Channel",
    "region" "Region",
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "global_policies_region_notification_type_channel_idx" ON "global_policies"("region", "notification_type", "channel");

-- AddForeignKey
ALTER TABLE "default_preferences" ADD CONSTRAINT "default_preferences_notification_type_fkey" FOREIGN KEY ("notification_type") REFERENCES "notification_types"("type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference_overrides" ADD CONSTRAINT "user_preference_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference_overrides" ADD CONSTRAINT "user_preference_overrides_notification_type_fkey" FOREIGN KEY ("notification_type") REFERENCES "notification_types"("type") ON DELETE RESTRICT ON UPDATE CASCADE;
