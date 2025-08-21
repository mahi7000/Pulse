/*
  Warnings:

  - You are about to alter the column `name` on the `Group` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `Group` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `name` on the `GroupChallenge` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `GroupChallenge` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `text` on the `GroupMessage` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to alter the column `name` on the `Habit` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `Habit` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `color` on the `Habit` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `email` on the `Otp` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `code` on the `Otp` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to alter the column `token` on the `RevokedToken` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- DropForeignKey
ALTER TABLE "public"."ChallengeParticipant" DROP CONSTRAINT "ChallengeParticipant_challengeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ChallengeParticipant" DROP CONSTRAINT "ChallengeParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Group" DROP CONSTRAINT "Group_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupAdmin" DROP CONSTRAINT "GroupAdmin_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupAdmin" DROP CONSTRAINT "GroupAdmin_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupChallenge" DROP CONSTRAINT "GroupChallenge_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupMember" DROP CONSTRAINT "GroupMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupMessage" DROP CONSTRAINT "GroupMessage_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupMessage" DROP CONSTRAINT "GroupMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Habit" DROP CONSTRAINT "Habit_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."HabitLog" DROP CONSTRAINT "HabitLog_habitId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Streak" DROP CONSTRAINT "Streak_habitId_fkey";

-- AlterTable
ALTER TABLE "public"."Group" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "public"."GroupChallenge" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "public"."GroupMessage" ALTER COLUMN "text" SET DATA TYPE VARCHAR(1000);

-- AlterTable
ALTER TABLE "public"."Habit" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "color" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "public"."Otp" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "code" SET DATA TYPE VARCHAR(10);

-- AlterTable
ALTER TABLE "public"."RevokedToken" ALTER COLUMN "token" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "password" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE INDEX "ChallengeParticipant_userId_challengeId_idx" ON "public"."ChallengeParticipant"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "GroupChallenge_groupId_idx" ON "public"."GroupChallenge"("groupId");

-- CreateIndex
CREATE INDEX "GroupChallenge_startDate_endDate_idx" ON "public"."GroupChallenge"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "public"."GroupMember"("userId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "public"."GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMessage_groupId_sentAt_idx" ON "public"."GroupMessage"("groupId", "sentAt");

-- CreateIndex
CREATE INDEX "GroupMessage_sentAt_idx" ON "public"."GroupMessage"("sentAt");

-- CreateIndex
CREATE INDEX "Habit_userId_idx" ON "public"."Habit"("userId");

-- CreateIndex
CREATE INDEX "Habit_createdAt_idx" ON "public"."Habit"("createdAt");

-- CreateIndex
CREATE INDEX "HabitLog_habitId_date_idx" ON "public"."HabitLog"("habitId", "date");

-- CreateIndex
CREATE INDEX "HabitLog_date_idx" ON "public"."HabitLog"("date");

-- CreateIndex
CREATE INDEX "HabitLog_completed_idx" ON "public"."HabitLog"("completed");

-- CreateIndex
CREATE INDEX "Otp_email_idx" ON "public"."Otp"("email");

-- CreateIndex
CREATE INDEX "Otp_expiresAt_idx" ON "public"."Otp"("expiresAt");

-- CreateIndex
CREATE INDEX "Streak_habitId_idx" ON "public"."Streak"("habitId");

-- CreateIndex
CREATE INDEX "Streak_lastUpdated_idx" ON "public"."Streak"("lastUpdated");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "public"."User"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "public"."Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Streak" ADD CONSTRAINT "Streak_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "public"."Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupAdmin" ADD CONSTRAINT "GroupAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupAdmin" ADD CONSTRAINT "GroupAdmin_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMessage" ADD CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupChallenge" ADD CONSTRAINT "GroupChallenge_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChallengeParticipant" ADD CONSTRAINT "ChallengeParticipant_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."GroupChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
