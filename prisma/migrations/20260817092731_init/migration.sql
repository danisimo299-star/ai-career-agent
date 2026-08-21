-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('STUDENT', 'GRADUATE', 'JUNIOR', 'CAREER_CHANGER', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "WorkFormat" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE', 'ANY');

-- CreateEnum
CREATE TYPE "EducationStage" AS ENUM ('SCHOOL', 'COLLEGE', 'UNIVERSITY', 'WORKING');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "GrowthPotential" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('YOUTUBE', 'DOCUMENTATION', 'COURSE', 'BOOK', 'ARTICLE');

-- CreateEnum
CREATE TYPE "ResourceDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CareerMissionStatus" AS ENUM ('AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ResumeTemplate" AS ENUM ('MODERN', 'PROFESSIONAL', 'MINIMAL');

-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('GENERAL', 'TECHNICAL', 'BEHAVIORAL', 'HR', 'MIXED', 'RESUME_BASED');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('MOCK', 'HH_RU');

-- CreateEnum
CREATE TYPE "SavedJobStatus" AS ENUM ('SAVED', 'PREPARING', 'APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER');

-- CreateEnum
CREATE TYPE "CoachMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "age" INTEGER,
    "experienceLevel" "ExperienceLevel",
    "educationStage" "EducationStage",
    "preferredFormat" "WorkFormat",
    "city" TEXT,
    "country" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "educationHistory" JSONB,
    "salaryExpectation" TEXT,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "personalitySummary" TEXT,
    "careerDna" JSONB,
    "careerScore" INTEGER,
    "careerInsights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interviewTopicsCovered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careerPriorities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questionnaireCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "questionSpec" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "learningTimeMonths" INTEGER NOT NULL DEFAULT 6,
    "growthPotential" "GrowthPotential" NOT NULL DEFAULT 'MEDIUM',
    "difficultyLevel" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerTitle" TEXT NOT NULL,
    "careerRecommendationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_milestones" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "whyItMatters" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "estimatedWeeks" INTEGER NOT NULL,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MilestoneStatus" NOT NULL DEFAULT 'LOCKED',

    CONSTRAINT "roadmap_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_resources" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "provider" TEXT,
    "difficulty" "ResourceDifficulty",
    "language" TEXT,
    "url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "roadmap_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT,
    "milestoneId" TEXT,
    "roadmapTaskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "instructions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whyItMatters" TEXT NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "skill" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "CareerMissionStatus" NOT NULL DEFAULT 'AVAILABLE',
    "missionDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "career_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_resources" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "provider" TEXT,
    "difficulty" "ResourceDifficulty",
    "language" TEXT,
    "url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mission_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "template" "ResumeTemplate" NOT NULL DEFAULT 'MODERN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "type" "InterviewType" NOT NULL DEFAULT 'MIXED',
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'JUNIOR',
    "questionCount" INTEGER NOT NULL DEFAULT 5,
    "status" "InterviewSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "report" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "InterviewType" NOT NULL DEFAULT 'GENERAL',
    "skill" TEXT,
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "question" TEXT NOT NULL,
    "userAnswer" TEXT,
    "aiEvaluation" TEXT,
    "scoreBreakdown" JSONB,
    "score" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "idealAnswerNotes" TEXT,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "matchReason" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "source" "JobSource" NOT NULL DEFAULT 'MOCK',
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employmentType" TEXT,
    "workFormat" "WorkFormat",
    "experienceLevel" TEXT,
    "matchScore" INTEGER,
    "matchBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT,
    "workFormat" "WorkFormat",
    "experienceLevel" "ExperienceLevel",
    "employmentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salaryExpectationMin" INTEGER,
    "openToInternship" BOOLEAN NOT NULL DEFAULT false,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "source" "JobSource" NOT NULL DEFAULT 'MOCK',
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matchScore" INTEGER,
    "matchBreakdown" JSONB,
    "status" "SavedJobStatus" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CoachMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "suggestedActions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_memory_facts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_memory_facts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_userId_createdAt_idx" ON "chat_messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "career_recommendations_userId_idx" ON "career_recommendations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmaps_userId_key" ON "roadmaps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmaps_careerRecommendationId_key" ON "roadmaps"("careerRecommendationId");

-- CreateIndex
CREATE INDEX "roadmap_milestones_roadmapId_order_idx" ON "roadmap_milestones"("roadmapId", "order");

-- CreateIndex
CREATE INDEX "roadmap_tasks_milestoneId_order_idx" ON "roadmap_tasks"("milestoneId", "order");

-- CreateIndex
CREATE INDEX "roadmap_resources_taskId_idx" ON "roadmap_resources"("taskId");

-- CreateIndex
CREATE INDEX "career_missions_userId_missionDate_idx" ON "career_missions"("userId", "missionDate");

-- CreateIndex
CREATE INDEX "career_missions_roadmapTaskId_idx" ON "career_missions"("roadmapTaskId");

-- CreateIndex
CREATE INDEX "mission_resources_missionId_idx" ON "mission_resources"("missionId");

-- CreateIndex
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");

-- CreateIndex
CREATE INDEX "resumes_userId_updatedAt_idx" ON "resumes"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "interview_sessions_userId_idx" ON "interview_sessions"("userId");

-- CreateIndex
CREATE INDEX "interview_sessions_userId_status_idx" ON "interview_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "interview_questions_sessionId_order_idx" ON "interview_questions"("sessionId", "order");

-- CreateIndex
CREATE INDEX "missions_userId_idx" ON "missions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "missions_userId_key_key" ON "missions"("userId", "key");

-- CreateIndex
CREATE INDEX "job_recommendations_userId_idx" ON "job_recommendations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "job_preferences_userId_key" ON "job_preferences"("userId");

-- CreateIndex
CREATE INDEX "saved_jobs_userId_idx" ON "saved_jobs"("userId");

-- CreateIndex
CREATE INDEX "saved_jobs_userId_status_idx" ON "saved_jobs"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_userId_sourceUrl_key" ON "saved_jobs"("userId", "sourceUrl");

-- CreateIndex
CREATE INDEX "coach_messages_userId_createdAt_idx" ON "coach_messages"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "coach_memory_facts_userId_createdAt_idx" ON "coach_memory_facts"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_careerRecommendationId_fkey" FOREIGN KEY ("careerRecommendationId") REFERENCES "career_recommendations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "roadmap_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_resources" ADD CONSTRAINT "roadmap_resources_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "roadmap_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_missions" ADD CONSTRAINT "career_missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_missions" ADD CONSTRAINT "career_missions_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_missions" ADD CONSTRAINT "career_missions_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "roadmap_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_missions" ADD CONSTRAINT "career_missions_roadmapTaskId_fkey" FOREIGN KEY ("roadmapTaskId") REFERENCES "roadmap_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_resources" ADD CONSTRAINT "mission_resources_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "career_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "interview_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_recommendations" ADD CONSTRAINT "job_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_preferences" ADD CONSTRAINT "job_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_messages" ADD CONSTRAINT "coach_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_memory_facts" ADD CONSTRAINT "coach_memory_facts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
