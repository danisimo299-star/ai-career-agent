---
target: ProfyMind mobile review
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
timestamp: 2026-09-07T14-28-56Z
slug: src-components-landing-landing-page-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/technical_evidence)

ProfyMind: mobile UX review, 2026-09-07

Scope: live public landing at https://profymind.ru and registration at 390px; landing also desktop and 320px. Authenticated dashboard, onboarding and chat reviewed from local source only. Physical-device keyboard and authenticated production behavior not tested. No product code changes.

Design specificity: coherent neutral theme, but hero plus six equal feature cards reads as a generic AI SaaS. Add a clearly labeled example showing experience → suggested role → next action. Preserve the existing visual identity.

Strengths: mobile bottom navigation already has labels/active state/safe-area; dashboard already provides a personalized next action; onboarding saves answers; chat offers stop/retry.

Priority findings:
1. P1: 320px viewport has document.scrollWidth 384px, clipping header/hero/actions. Header and CTA groups never stack, buttons shrink-0/nowrap. Landing lines 21,38; button.tsx line 7. Fix responsive stacking, compact header, 44–48px primary mobile touch targets. Live controls: header32px, CTA36px, registration inputs32px with16px font. Command: /impeccable adapt.
2. P2: mobile dashboard presents hero, readiness, metrics, four stacked previews and chat. Make next action and today's task lead; collapse secondary metrics. dashboard-overview.tsx. Command: /impeccable distill.
3. P2: mobile navigation includes Home/Missions/Coach/Resume/More; Jobs is in More. If job seekers are primary, prioritize Jobs and move Resume to More/profile. Hypothesis requiring audience/usage evidence. mobile-bottom-nav.tsx:13. Command: /impeccable shape.
4. P2: onboarding has seven screens and no skip; 11 interests/8 goals create long choices. Answers persist, current step resets to welcome. Start with goal/current situation, collect other details when needed, restore step. onboarding-wizard.tsx:41,61. Command: /impeccable onboard.
5. P2: chat draft exists only in React state and is lost on remount/reload. Composer is in normal flow; test keyboard and long history on physical iOS/Android before claiming overlap. Preserve drafts and ensure composer stays accessible. coach/chat-panel.tsx:162,491; shared/message-composer.tsx:19. Commands: /impeccable adapt and /impeccable harden.

Additional: registration fetch/signIn rejected promises lack catch/localized connection recovery (auth/register-form.tsx:30–57), source-only finding. Public landing would benefit from an example result before account creation, plainer ATS explanation, and a shorter single primary CTA. No fabricated outcomes or guaranteed employment claims.

Heuristic scores, preliminary source/live assessment, 0–4:
|Heuristic|Score|Evidence|
|---|---:|---|
|Status|3|Progress, streaming, active navigation|
|User language|3|Mostly clear; ATS jargon|
|Control|2|Back/Stop exist; onboarding mandatory|
|Consistency|3|Shared components|
|Error prevention|2|Validation, but drafts not preserved|
|Recognition|2|Labeled navigation; seven More items|
|Efficiency|2|Quick actions, long mobile paths|
|Minimalism|2|Long dashboard feed|
|Recovery|2|Retry, some developer-facing errors|
|Help|2|Repeatable tour, limited task guidance|
|Total|23/40|Subjective preliminary review, not a measured product metric|

Cognitive load: moderate dashboard; five coach tabs, seven More entries, eleven interest choices, eight goals. Newcomer faces collection before visible value; interrupted mobile user loses current onboarding step and unsent chat draft; motor-impaired user faces small controls. Emotional opportunity: replace the weight of unfinished metrics with one achievable next action.

Detector: 136 supported component files, exit0, JSON [], zero findings. Static detector cannot validate responsive layout, so this does not contradict measured overflow. No false positives. Browser injection/overlay unavailable because CUA evaluate is read-only. No server started.

Product additions worth exploring: clearly labeled preview before registration; a single persistent route from chosen goal through today's action to a real result, using existing roadmap/missions/job tracking rather than adding competing modules.

Question for next iteration: is the main mobile audience choosing a profession or actively looking for a job? Prioritize navigation accordingly.
