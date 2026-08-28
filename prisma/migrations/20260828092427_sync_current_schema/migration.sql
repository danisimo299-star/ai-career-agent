-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('IDLE', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiReplyStyle" AS ENUM ('BRIEF', 'BALANCED', 'DETAILED');

-- CreateEnum
CREATE TYPE "InterviewAttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MarketDemand" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'UNKNOWN');

-- AlterTable
ALTER TABLE "career_recommendations" ADD COLUMN     "firstJobTitle" TEXT,
ADD COLUMN     "hhAreaId" INTEGER,
ADD COLUMN     "hhProfessionalRoleId" INTEGER,
ADD COLUMN     "hhRoleName" TEXT,
ADD COLUMN     "hhSearchTitle" TEXT,
ADD COLUMN     "marketCheckedAt" TIMESTAMP(3),
ADD COLUMN     "marketCheckedCity" TEXT,
ADD COLUMN     "marketDemand" "MarketDemand" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "marketMatchedQuery" TEXT,
ADD COLUMN     "searchAliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "vacancyCountCity" INTEGER,
ADD COLUMN     "vacancyCountRussia" INTEGER;

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "attemptId" TEXT;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "aiRememberHistory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiReplyStyle" "AiReplyStyle" NOT NULL DEFAULT 'BALANCED',
ADD COLUMN     "aiUseProfileContext" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "careerAnalysisError" TEXT,
ADD COLUMN     "careerAnalysisStartedAt" TIMESTAMP(3),
ADD COLUMN     "careerAnalysisStatus" "GenerationStatus" NOT NULL DEFAULT 'IDLE',
ADD COLUMN     "careerSummary" TEXT,
ADD COLUMN     "interviewVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tourCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "interview_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "InterviewAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "topCareerTitle" TEXT,

    CONSTRAINT "interview_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interview_attempts_userId_startedAt_idx" ON "interview_attempts"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "chat_messages_attemptId_createdAt_idx" ON "chat_messages"("attemptId", "createdAt");

-- AddForeignKey
ALTER TABLE "interview_attempts" ADD CONSTRAINT "interview_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "interview_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

