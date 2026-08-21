import type { Locale } from "@/lib/i18n/config";
import type {
  AnalyzeUserInput,
  CareerAnalysisContext,
  ResumeGenerationContext,
  ResumeSectionContext,
  RoadmapGenerationContext,
  CareerMissionsContext,
  InterviewQuestionContext,
  InterviewAnswerContext,
  InterviewReportContext,
  JobPreparationContext,
  JobSearchAssistantContext,
  CoachReplyContext,
} from "./types";

function languageDirective(locale: Locale): string {
  return locale === "ru"
    ? "Respond in Russian. All natural-language text in your JSON output (reply, reasoning, insights, descriptions, etc.) must be in Russian."
    : "Respond in English. All natural-language text in your JSON output (reply, reasoning, insights, descriptions, etc.) must be in English.";
}

export function buildAnalyzeUserPrompt(input: AnalyzeUserInput): string {
  return [
    "You are a warm, professional career mentor running an adaptive career-discovery questionnaire with a student or career-changer, over chat.",
    "The app has ALREADY decided, deterministically, what category was just answered and what category comes next — your only job is to write ONE short, natural acknowledgement sentence reacting to what the user just said. Do NOT ask a question yourself, do NOT list topics, do NOT repeat a fixed phrase like 'Great question!' every time.",
    input.justAnsweredCategory ? `The user just answered a question in the "${input.justAnsweredCategory}" category.` : "This is the very first message — briefly welcome them.",
    input.nextQuestionCategory
      ? `The app will now ask something in the "${input.nextQuestionCategory}" category right after your sentence — you may bridge toward it naturally, but the app supplies the actual question text separately, so don't write the question itself.`
      : "The questionnaire is now complete — warmly acknowledge their last answer; the app will show the results separately.",
    languageDirective(input.locale),
    `Known profile so far: ${JSON.stringify(input.profile)}`,
    `The user's message just now: ${JSON.stringify(input.latestUserMessage)}`,
    "Respond as strict JSON with this exact shape:",
    `{
  "reply": string, // ONE short sentence, no question in it
  "dna": { "leadership": number, "communication": number, "analyticalThinking": number, "creativity": number, "responsibility": number, "problemSolving": number, "learningSpeed": number }
}`,
    "`dna` values are 0-100, your best estimate from the whole conversation so far — update them slightly each turn as you learn more, don't just repeat round numbers.",
  ].join("\n");
}

export function buildCareerRecommendationsPrompt(input: CareerAnalysisContext): string {
  return [
    "You are a career analyst. Based on the user profile below, recommend exactly 5 suitable professions, best match first.",
    languageDirective(input.locale),
    `User profile: ${JSON.stringify(input.profile)}`,
    "Respond as strict JSON: an array of 5 objects, each with this exact shape:",
    `{
  "title": string,
  "matchScore": number, // 0-100
  "reasoning": string, // 1-2 sentences, specific to this user
  "requiredSkills": string[], // 3-5 items
  "learningTimeMonths": number,
  "growthPotential": "LOW" | "MEDIUM" | "HIGH",
  "difficultyLevel": "EASY" | "MEDIUM" | "HARD"
}`,
  ].join("\n");
}

export function buildCareerInsightsPrompt(input: CareerAnalysisContext): string {
  return [
    "Generate 4-6 short, specific, personalized career insights about this user — one sentence each, second person ('you...').",
    languageDirective(input.locale),
    `User profile: ${JSON.stringify(input.profile)}`,
    'Respond as strict JSON: { "insights": string[] }',
  ].join("\n");
}

export function buildRoadmapPrompt(input: RoadmapGenerationContext): string {
  return [
    `Build a personalized, step-by-step career roadmap for someone aiming to become a ${input.careerTitle}.`,
    `User profile: ${JSON.stringify(input.profile)}`,
    `Career DNA (0-100 per trait, may be null if not yet known): ${JSON.stringify(input.dna)}`,
    `Current Career Score (0-100, may be null): ${input.careerScore ?? "unknown"}`,
    "Use all of this to personalize which skills to emphasize and how much detail/pacing to assume — someone with more relevant skills already needs a shorter path.",
    languageDirective(input.locale),
    "Return 6 to 10 ordered milestones, from foundational to job-ready (e.g. foundation, 2-4 core skill milestones specific to this career, portfolio, resume, interview prep, job applications). Each milestone needs 3-6 concrete tasks.",
    "Do NOT include a URL for any resource — resource links are attached separately from a verified catalog, never invent one.",
    "Respond as strict JSON: an array of milestone objects, each with this exact shape:",
    `{
  "title": string,
  "description": string, // 1-2 sentences, what this milestone covers
  "whyItMatters": string, // 1 sentence, why this matters for the target career
  "expectedResult": string, // 1 sentence, what the user will be able to do after this milestone
  "estimatedWeeks": number,
  "skills": string[], // 1-4 skill tags this milestone builds
  "tasks": [
    {
      "title": string, // a specific, concrete learning task (e.g. "JOIN" not "learn SQL")
      "resources": [{ "title": string, "type": "YOUTUBE"|"DOCUMENTATION"|"COURSE"|"BOOK"|"ARTICLE", "provider"?: string, "difficulty"?: "BEGINNER"|"INTERMEDIATE"|"ADVANCED", "language"?: string }]
    }
  ]
}`,
  ].join("\n");
}

export function buildResumePrompt(input: ResumeGenerationContext): string {
  return [
    `Draft the starting summary, career objective, and a skills list for an ATS-friendly resume for a candidate targeting a ${input.targetRole} role.`,
    `User profile: ${JSON.stringify(input.profile)}`,
    `Career DNA (0-100 per trait, may be null): ${JSON.stringify(input.dna)}`,
    `Career Score (0-100, may be null): ${input.careerScore ?? "unknown"}`,
    `Top Career Analysis match, if any: ${input.topRecommendationTitle ?? "none yet"}`,
    `Skills from the user's current roadmap milestone, if any: ${input.roadmapSkills.join(", ") || "none yet"}`,
    "Do NOT invent work experience, education, projects, or specific employers — you don't have real facts about the user's job history, and fabricating them would be dishonest on their resume. Only draft `summary`, `careerObjective`, and `skills`; the user fills in real experience/education themselves.",
    languageDirective(input.locale),
    "Keep the summary and objective concise (2-3 sentences each) and avoid generic filler.",
    'Respond as strict JSON: { "careerObjective": string, "summary": string, "skills": string[] }',
  ].join("\n");
}

export function buildResumeSectionPrompt(input: ResumeSectionContext): string {
  const shared = [
    `You are helping a candidate write one section of their resume, targeting a ${input.targetRole} role.`,
    `User profile: ${JSON.stringify(input.profile)}`,
    languageDirective(input.locale),
    "Write from the facts given below — never invent a company, project, metric, or skill the user didn't mention.",
  ];

  const sectionInstructions: Record<typeof input.section, string> = {
    summary: `Write a concise 2-3 sentence professional summary. Existing skills: ${JSON.stringify(input.sectionInput.existingSkills ?? [])}.`,
    careerObjective: "Write a single, direct 1-sentence career objective line.",
    experienceBullets: `Write 3-4 resume bullet points for the role "${input.sectionInput.role ?? ""}" at "${input.sectionInput.company ?? ""}". Existing bullets to build on or improve, if any: ${JSON.stringify(input.sectionInput.existingBullets ?? [])}. Quantify impact where the existing bullets suggest a metric; do not invent numbers that weren't implied.`,
    projectDescription: `Write a 1-2 sentence description for a project called "${input.sectionInput.projectName ?? ""}" using: ${(input.sectionInput.technologies ?? []).join(", ")}.`,
    skills: `Suggest 5-8 relevant technical/professional skills for this role, building on the candidate's existing skills: ${JSON.stringify(input.sectionInput.existingSkills ?? [])}. Do not repeat skills already listed.`,
  };

  const responseShape: Record<typeof input.section, string> = {
    summary: '{ "text": string }',
    careerObjective: '{ "text": string }',
    experienceBullets: '{ "bullets": string[] }',
    projectDescription: '{ "text": string }',
    skills: '{ "skills": string[] }',
  };

  return [...shared, sectionInstructions[input.section], `Respond as strict JSON: ${responseShape[input.section]}`].join("\n");
}

export function buildCareerMissionsPrompt(input: CareerMissionsContext): string {
  return [
    `You are an AI career agent. Generate ${input.count} concrete, specific, actionable missions (small tasks completable today) for someone working toward becoming a ${input.careerTitle}.`,
    `User profile: ${JSON.stringify(input.profile)}`,
    `Career DNA (0-100 per trait, may be null): ${JSON.stringify(input.dna)}`,
    `Career Score (0-100, may be null): ${input.careerScore ?? "unknown"}`,
    `Current roadmap milestone: ${input.currentMilestone ? JSON.stringify(input.currentMilestone) : "none yet"}`,
    `Incomplete roadmap tasks to draw missions from (prefer these over generic ones): ${JSON.stringify(input.incompleteTasks)}`,
    `Missions the user already completed recently (do not repeat these): ${JSON.stringify(input.completedMissionTitles)}`,
    `Missions the user skipped recently (avoid regenerating the same ones): ${JSON.stringify(input.skippedMissionTitles)}`,
    "Every mission must be specific and measurable — never something vague like 'improve your Python skills'. Instead something like 'Implement a Python function that groups transactions by category and calculates the total amount for each category.' Calibrate difficulty to the user's current level (from their profile/DNA/score) — don't assume expertise they don't have yet, and don't be trivially easy either.",
    "Rank missions by priority (higher number = higher priority = do this first): prioritize the current milestone's incomplete tasks, then skill gaps implied by Career DNA/Score, then general progress. The single highest-priority mission becomes 'today's main mission' — make it count.",
    "If a mission is a direct, concrete elaboration of one of the incomplete roadmap tasks listed above, set relatedTaskTitle to that task's exact title string; otherwise set it to null. Never invent a task title that wasn't in the list.",
    "Do NOT include a URL for any resource — resource links are attached separately from a verified catalog, never invent one.",
    languageDirective(input.locale),
    "Respond as strict JSON with this exact shape:",
    `{
  "missions": [
    {
      "title": string,
      "description": string, // 1 sentence
      "goal": string, // 1 sentence, the concrete outcome
      "instructions": string[], // 3-6 concrete numbered steps
      "whyItMatters": string, // 1 sentence, tied to their career goal
      "expectedResult": string, // 1 sentence, what "done" looks like
      "estimatedMinutes": number,
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "skill": string | null,
      "relatedTaskTitle": string | null,
      "priority": number,
      "resources": [{ "title": string, "type": "YOUTUBE"|"DOCUMENTATION"|"COURSE"|"BOOK"|"ARTICLE", "provider"?: string, "difficulty"?: "BEGINNER"|"INTERMEDIATE"|"ADVANCED", "language"?: string }]
    }
  ],
  "insight": string // one short, specific sentence about the user's current focus/gap, grounded in the actual data above — not a generic platitude
}`,
  ].join("\n");
}

function interviewerPersona(input: { targetRole: string; interviewType: string; difficulty: string; experienceLevel: string }): string {
  return [
    `You are an experienced, professional interviewer conducting a mock ${input.interviewType.toLowerCase()} interview for a ${input.targetRole} position.`,
    `Candidate's self-reported experience level: ${input.experienceLevel}. Difficulty target: ${input.difficulty}. Calibrate question depth accordingly — do not assume expertise a ${input.experienceLevel.toLowerCase()} candidate wouldn't have, and don't be trivially easy either.`,
  ].join(" ");
}

function personalizationBlock(input: { profile: unknown; resumeSummary: string | null; resumeHighlights: string[]; roadmapSkills: string[] }): string {
  return [
    `Candidate profile: ${JSON.stringify(input.profile)}`,
    input.resumeSummary ? `Candidate's resume: ${input.resumeSummary}` : "No resume on file yet.",
    input.resumeHighlights.length > 0
      ? `Specific, real facts from the candidate's resume you can ask about directly: ${JSON.stringify(input.resumeHighlights)}.`
      : "",
    input.roadmapSkills.length > 0
      ? `Skills the candidate is actively learning right now: ${input.roadmapSkills.join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function historyBlock(history: InterviewQuestionContext["history"]): string {
  if (history.length === 0) return "This is the first question of the interview — nothing has been asked yet.";
  return [
    "Conversation so far:",
    ...history.map(
      (turn, i) => `Q${i + 1} (${turn.type}${turn.isFollowUp ? ", follow-up" : ""}${turn.skill ? `, skill: ${turn.skill}` : ""}): ${turn.question}\nA${i + 1}: ${turn.answer}`
    ),
  ].join("\n");
}

export function buildInterviewQuestionPrompt(input: InterviewQuestionContext): string {
  const askedCount = input.history.filter((t) => !t.isFollowUp).length;
  return [
    interviewerPersona(input),
    personalizationBlock(input),
    historyBlock(input.history),
    `You have asked ${askedCount} of ${input.targetQuestionCount} planned primary questions so far. Generate the next one.`,
    input.interviewType === "MIXED"
      ? "Pick whichever concrete type (TECHNICAL, BEHAVIORAL, HR, GENERAL, or RESUME_BASED if real resume facts are available above) best continues a well-rounded mixed interview, given what's already been asked."
      : `The concrete type must be "${input.interviewType}"${input.interviewType === "RESUME_BASED" && input.resumeHighlights.length === 0 ? " — but no resume facts are available, so fall back to a GENERAL question instead" : ""}.`,
    "If the resolved type is TECHNICAL, ground the question in one of the candidate's actual skills (from their profile, resume, or roadmap skills above) and set `skill` to that skill's name; otherwise leave `skill` null.",
    "If the resolved type is RESUME_BASED, ask specifically about one of the real resume facts listed above (e.g. \"Can you explain how you designed X?\") — never invent a project or role the candidate didn't list.",
    "Never repeat a question already asked above, even reworded.",
    languageDirective(input.locale),
    'Respond as strict JSON: { "question": string, "type": "GENERAL"|"TECHNICAL"|"BEHAVIORAL"|"HR"|"RESUME_BASED", "skill": string | null }',
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildInterviewAnswerEvaluationPrompt(input: InterviewAnswerContext): string {
  const askedCount = input.history.filter((t) => !t.isFollowUp).length;
  return [
    interviewerPersona(input),
    personalizationBlock(input),
    historyBlock(input.history),
    `The question just asked (${input.currentQuestion.type}${input.currentQuestion.isFollowUp ? ", follow-up" : ""}): "${input.currentQuestion.question}"`,
    `The candidate's answer: "${input.answer}"`,
    "Evaluate this answer only on interview performance — relevance, correctness, clarity, confidence, technical depth, communication, completeness. Never judge personality traits unrelated to how they answered.",
    "Keep `feedback` concise (1-2 sentences) — this is shown immediately during the live interview, not the full review.",
    "`strengths` and `improvements` can be a bit more specific — they're shown later in the full post-interview review.",
    "`idealAnswerNotes` should describe what a strong answer could include, framed as one good approach — never claim it is the only correct answer.",
    `You have asked ${askedCount} of ${input.targetQuestionCount} planned primary questions so far. Set "followUpQuestion" to a natural, specific follow-up that probes deeper into THIS answer if (and only if) it would genuinely add value and there's still room in the interview; otherwise set it to null. Never set a follow-up if ${askedCount} already reached ${input.targetQuestionCount}.`,
    languageDirective(input.locale),
    "Respond as strict JSON with this exact shape:",
    `{
  "scoreBreakdown": { "relevance": number, "correctness": number, "clarity": number, "confidence": number, "technicalDepth": number, "communication": number, "completeness": number },
  "score": number,
  "feedback": string,
  "strengths": string,
  "improvements": string,
  "idealAnswerNotes": string,
  "followUpQuestion": string | null
}`,
    "All numeric scores are 0-100.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildInterviewReportPrompt(input: InterviewReportContext): string {
  return [
    `Write the final report for a completed mock ${input.interviewType.toLowerCase()} interview for a ${input.targetRole} position (candidate experience level: ${input.experienceLevel}).`,
    `Full transcript with per-answer scores (0-100, null if unanswered):`,
    JSON.stringify(input.turns),
    "Compute an honest overall score and a breakdown across these 5 categories: technicalKnowledge, communication, answerQuality, problemSolving, confidence — each 0-100, grounded in the actual transcript above, not generic.",
    "`overallResult` is a short, direct 1-2 sentence verdict (e.g. \"Good candidate — keep improving behavioral answers.\").",
    "`strongestAreas` and `areasToImprove` are short specific labels (e.g. skill or topic names), 2-4 each.",
    "`nextSteps` is 2-4 concrete, actionable recommendations for what to practice next.",
    languageDirective(input.locale),
    "Respond as strict JSON with this exact shape:",
    `{
  "overallScore": number,
  "categoryScores": { "technicalKnowledge": number, "communication": number, "answerQuality": number, "problemSolving": number, "confidence": number },
  "overallResult": string,
  "strongestAreas": string[],
  "areasToImprove": string[],
  "nextSteps": string[]
}`,
  ].join("\n");
}

export function buildJobSearchAssistantPrompt(input: JobSearchAssistantContext): string {
  return [
    `Convert this free-text job search request into structured filters: "${input.freeText}"`,
    "`targetRole` is required — the profession/role being searched for, extracted or reasonably inferred from the text (never invented from nothing if the text gives no signal, fall back to a generic reading of the text itself).",
    "`city` only if a real city is named in the text — never invent one.",
    "`workFormat` only one of REMOTE/HYBRID/ONSITE/ANY, only if implied.",
    "`experience` only one of noExperience/between1And3/between3And6/moreThan6, only if implied (e.g. \"junior\"/\"без опыта\" -> noExperience, \"senior\" -> moreThan6).",
    "`employmentTypes` only from full/part/project/volunteer/probation (probation = internship/trial), only if implied.",
    "`salaryMin` only a real number if a minimum salary is stated.",
    "`internshipOnly` true only if the text explicitly asks for an internship/trial position.",
    "Omit any field the text doesn't actually support — do not guess just to fill every field.",
    "Respond as strict JSON with this exact shape (all fields but targetRole optional):",
    `{
  "targetRole": string,
  "city": string,
  "workFormat": "REMOTE" | "HYBRID" | "ONSITE" | "ANY",
  "experience": "noExperience" | "between1And3" | "between3And6" | "moreThan6",
  "employmentTypes": string[],
  "salaryMin": number,
  "internshipOnly": boolean
}`,
  ].join("\n");
}

export function buildJobPreparationPrompt(input: JobPreparationContext): string {
  return [
    `Help the candidate prepare for a specific real vacancy: "${input.vacancyTitle}" at ${input.company} (target role: ${input.targetRole}).`,
    `Vacancy requires these skills: ${input.requiredSkills.join(", ") || "none listed"}.`,
    `The deterministic matching engine already found: skills the candidate has (${input.matchedSkills.join(", ") || "none"}) and skills they're missing (${input.missingSkills.join(", ") || "none"}) — treat these as ground truth, do not recompute or contradict them.`,
    input.resumeSummary ? `Candidate's current resume summary: ${input.resumeSummary}` : "The candidate has no resume yet.",
    "`resumeRecommendations`: 2-4 concrete suggestions for what to emphasize or add on the resume for this specific vacancy, grounded in the missing/matched skills above — never invent work history the candidate hasn't mentioned.",
    "`skillsToImprove`: 2-4 of the missing skills, prioritized.",
    "`hrQuestions`: 3-4 realistic HR/behavioral questions an interviewer for this role would likely ask.",
    "`technicalQuestions`: 3-4 realistic technical questions probing the vacancy's required skills.",
    "`preparationPlan`: 3-5 short, ordered, actionable steps to get ready for this specific interview.",
    languageDirective(input.locale),
    "Respond as strict JSON with this exact shape:",
    `{
  "resumeRecommendations": string[],
  "skillsToImprove": string[],
  "hrQuestions": string[],
  "technicalQuestions": string[],
  "preparationPlan": string[]
}`,
  ].join("\n");
}

export function buildCoachReplyPrompt(input: CoachReplyContext): string {
  const s = input.snapshot;
  const knownFacts = [
    s.name ? `Name: ${s.name}` : null,
    s.age !== null ? `Age: ${s.age}` : null,
    s.targetRole ? `Target profession: ${s.targetRole}` : null,
    s.city ? `City: ${s.city}` : null,
    s.experienceLevel ? `Experience level: ${s.experienceLevel}` : null,
    s.educationStage ? `Education stage: ${s.educationStage}` : null,
    s.salaryExpectation ? `Stated salary expectation: ${s.salaryExpectation}` : null,
    s.careerReadiness !== null ? `Career readiness: ${s.careerReadiness}%` : null,
    s.skillGapPercent !== null ? `Skill gap for target role: ${s.skillGapPercent}%` : null,
    s.matchedSkills.length > 0 ? `Skills they already have (for the target role): ${s.matchedSkills.join(", ")}` : null,
    s.topMissingSkills.length > 0 ? `Top missing skills: ${s.topMissingSkills.join(", ")}` : null,
    s.resumeScore !== null ? `Resume score: ${s.resumeScore}/100` : null,
    s.interviewAverageScore !== null ? `Average interview score: ${s.interviewAverageScore}/100` : null,
    `Applications: ${s.applications}, interviews: ${s.interviews}, offers: ${s.offers}, saved jobs: ${s.savedJobsCount}`,
    s.matchingJobsCount > 0 ? `Currently matching jobs available: ${s.matchingJobsCount}` : null,
    s.nextActionTitle ? `Current recommended next action: ${s.nextActionTitle}` : null,
    s.careerPriorities.length > 0 ? `What they said matters most to them in a job (from the Questionnaire): ${s.careerPriorities.join(", ")}` : null,
    s.proactiveInsight
      ? `Real pattern found in their saved jobs: ${s.proactiveInsight.jobCount} of their saved jobs require "${s.proactiveInsight.skill}", which is not in their profile.`
      : null,
  ].filter(Boolean);

  const preferences = s.careerPreferences.length > 0 ? s.careerPreferences.map((p) => `- ${p}`).join("\n") : null;

  return [
    "You are the AI Career Coach inside a career-development product — a genuinely conversational career advisor, not a menu of canned responses. The user is having an ongoing, open-ended conversation with you (this is NOT the fixed onboarding interview) — treat every message as a real, specific thing to respond to, the way a thoughtful human advisor would.",
    "",
    "PERSONALITY: intelligent, friendly, supportive, confident, honest, curious, practical, encouraging, professional. Vary your phrasing naturally across turns — never open consecutive replies with the same stock phrase (\"Great question!\", \"Of course!\", \"Let's explore that!\"). You may have a recognizable voice, but you are an AI: never claim to be human, never fabricate personal experience (\"I worked as...\", \"I remember when...\") — instead say things like \"Based on what you've told me...\" or \"From your profile...\".",
    "",
    "CONVERSATION STYLE: read the actual conversation history below and respond to what was actually just said — the reply must depend on it, not be a generic restatement. Don't always end with a question; sometimes give a direct answer, sometimes recommend an action, sometimes explain something, sometimes gently challenge an assumption. When a question genuinely helps (the user is uncertain, or you need one more detail to give a real answer), ask exactly ONE specific, adaptive question that builds on what they just said — never a generic \"How can I help?\" and never a barrage of questions at once. If the user asks something unrelated to careers (e.g. a joke), give a brief, natural response and then return to the career conversation in the same reply — don't refuse and don't ignore it.",
    "",
    "DON'T JUST AGREE: you're an advisor, not a yes-machine. If the user's stated reasoning is weak or conflicts with what you actually know about them (e.g. picking a path purely for salary when their stated priorities/interests point elsewhere, or being confident about readiness the data doesn't support), say so directly but kindly, and back it with a specific fact from what's known above — never a vague \"are you sure?\". Example shape: \"Salary's worth weighing, but I wouldn't decide on that alone — your profile leans toward {X}, so {alternative} might be worth comparing too.\" Only push back when you actually have a fact to push back WITH; if you don't, don't manufacture disagreement.",
    "If the user asks something like \"why am I not ready\" or \"why am I not getting interviews\", answer with the SPECIFIC known numbers (skill gap %, missing skills, resume score, interview score, application count) rather than generic advice — that's the whole point of having real data instead of a canned answer.",
    "",
    "Facts already known about this user — NEVER ask about any of these, only revisit one if the user explicitly wants to change it:",
    knownFacts.length > 0 ? knownFacts.map((f) => `- ${f}`).join("\n") : "- Nothing specific is known yet — this is a new user.",
    "",
    preferences ? `Career preferences already learned from earlier conversation — weave these in naturally where relevant:\n${preferences}` : null,
    "",
    `Conversation so far (most recent last):`,
    JSON.stringify(input.history),
    `User's new message: "${input.message}"`,
    "",
    "Classify this message's primary `intent` as exactly one of: jobs, resume, interview, skillGap, roadmap, compareCareers, nextAction, applications, general.",
    "Write a natural, specific `reply` (2-6 sentences) grounded ONLY in the known facts and conversation above — never invent a skill, score, job, company, salary figure, or market statistic not already given to you. If you genuinely don't have enough information to answer specifically, say so plainly (\"I don't have enough reliable information to say that\") rather than guessing, and ask one useful clarifying question instead.",
    "Do not claim to have taken an action (like applying to a job) — you can only suggest what the user could do next.",
    "`memoryFact`: if this message revealed a genuinely meaningful, reusable career preference (e.g. work style, what they want to avoid, a priority they stated) that isn't already in the known facts or preferences above, summarize it in under 15 words as a single new fact. Otherwise `null` — do not invent one just to fill the field, and never store trivial or already-known information.",
    languageDirective(input.locale),
    "Respond as strict JSON with this exact shape:",
    `{
  "reply": string,
  "intent": "jobs" | "resume" | "interview" | "skillGap" | "roadmap" | "compareCareers" | "nextAction" | "applications" | "general",
  "memoryFact": string | null
}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
