---
name: product-management
description: Product management frameworks including prioritization, metrics, PRDs, user research, enterprise product patterns, and creative ideation techniques. Use when planning features, writing PRDs, defining metrics, conducting product discovery, or evaluating product-market fit.
---

# Product Management Patterns

Apply these frameworks when making product decisions, planning features, or evaluating product strategy.

## Product Discovery Framework

| Signal | Action | Framework |
|--------|--------|-----------|
| New market/problem space | Explore | Design Thinking, JTBD interviews |
| Validated problem, unclear solution | Experiment | Rapid prototyping, A/B tests |
| Clear problem + solution | Execute | PRD, sprint planning |
| Mature feature, declining engagement | Optimize or sunset | Metrics analysis, sunset checklist |

## Prioritization Frameworks

### RICE Scoring

```
Score = (Reach x Impact x Confidence) / Effort

Reach: Users affected per quarter (number)
Impact: 3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal
Confidence: 100%=high, 80%=medium, 50%=low
Effort: Person-months to implement (number)
```

### MoSCoW Template

| Category | Criteria |
|----------|----------|
| Must Have | Product fails without this |
| Should Have | Important but workaround exists |
| Could Have | Nice to have, enhances UX |
| Won't Have (this time) | Explicitly deferred |

### Kano Model Categories

| Category | Description | Product Implication |
|----------|-------------|-------------------|
| Basic (Must-be) | Expected, causes dissatisfaction if missing | Invest enough to meet threshold |
| Performance | More is better, linear satisfaction | Benchmark against competitors |
| Excitement | Unexpected delight, differentiator | Invest for competitive advantage |
| Indifferent | Users do not care | Do not build |
| Reverse | Causes dissatisfaction when present | Remove or make optional |

## User Research Templates

### JTBD Interview Script

```
Context: When did you first realize you needed [solution]?
Push: What was happening that made you look for something new?
Pull: What was attractive about [solution]?
Anxiety: What concerns did you have about switching?
Habit: What would you miss about your current solution?
```

### Persona Template

```
Name: [Archetype name]
Role: [Job title / function]
Goals: [What they want to achieve]
Pain Points: [Current frustrations]
Decision Criteria: [What matters when evaluating solutions]
Enterprise Context: [Procurement influence, team size, compliance needs]
```

## Product Metrics Playbook

### North Star Metric Selection

| Product Type | Example North Star | Leading Indicators |
|-------------|-------------------|-------------------|
| SaaS Platform | Weekly active teams | Onboarding completion, feature adoption |
| Marketplace | Transactions per week | Listings created, search-to-purchase rate |
| Content/Media | Time reading per user | Articles opened, scroll depth |
| Developer Tool | Deployments per week | Integrations connected, CLI usage |

### OKR Template

```
Objective: [Qualitative, inspiring goal]

KR1: Increase [metric] from [X] to [Y] by [date]
KR2: Achieve [metric] of [target] by [date]
KR3: Reduce [metric] from [X] to [Y] by [date]

Confidence: [Low/Medium/High]
Dependencies: [What needs to happen]
```

### AARRR Pirate Metrics

| Stage | Metric | Enterprise Consideration |
|-------|--------|-------------------------|
| Acquisition | Sign-ups, demo requests | Procurement funnel length, POC success rate |
| Activation | First value moment, onboarding completion | Admin setup time, SSO configuration success |
| Retention | DAU/MAU, feature adoption, churn rate | Contract renewal rate, expansion revenue |
| Revenue | ARR, ACV, LTV, CAC payback | Seat expansion, upsell to higher tiers |
| Referral | NPS, organic referrals | Internal champion development, multi-dept adoption |

## Creative Ideation Frameworks

### SCAMPER Technique

| Letter | Question | Product Application |
|--------|----------|-------------------|
| Substitute | What can be replaced? | Replace manual process with automation |
| Combine | What can be merged? | Combine two features into one flow |
| Adapt | What can be borrowed? | Adapt a B2C pattern for B2B |
| Modify | What can be changed? | Simplify a complex feature |
| Put to other use | What else can this serve? | Repurpose data for a new insight |
| Eliminate | What can be removed? | Remove steps from a workflow |
| Reverse | What if we did the opposite? | Let users configure instead of prescribe |

### Blue Ocean Strategy Canvas

```
Competing Factors: [List 6-8 factors the industry competes on]

| Factor | Industry Avg | Our Product | Action |
|--------|-------------|-------------|--------|
| [Factor 1] | High | Eliminate | Reduce cost |
| [Factor 2] | Low | Raise | Differentiate |
| [Factor 3] | N/A | Create | New value |
```

## Enterprise Product Patterns

### Enterprise Readiness Matrix

| Capability | Starter | Professional | Enterprise |
|-----------|---------|-------------|------------|
| Auth | Email/password | SSO (SAML) | SSO + SCIM provisioning |
| Data | Shared | Isolated | Dedicated + residency options |
| Compliance | Basic | SOC2 | SOC2 + HIPAA + custom |
| Support | Community | Business hours | 24/7 + dedicated CSM |
| SLA | Best effort | 99.9% | 99.99% + custom |
| Audit | Basic logs | Full audit trail | Exportable + SIEM integration |

### Enterprise Buying Process

```
Champion (End User) -> Evaluator (Team Lead) -> Decision Maker (VP/C-level)
     |                      |                        |
Needs: Solve daily pain  Needs: Team ROI          Needs: Strategic value
Proof: Free trial/POC    Proof: Pilot results     Proof: Business case
Timeline: Days           Timeline: Weeks          Timeline: Months
```

## Quality Checklist

- [ ] Problem validated with user research (not assumptions)
- [ ] Target user persona defined with enterprise context
- [ ] Success metrics defined before development starts
- [ ] MVP scope explicitly bounded (in-scope and out-of-scope)
- [ ] RICE or equivalent prioritization score calculated
- [ ] Enterprise requirements gathered (SSO, compliance, audit)
- [ ] Go-to-market plan drafted
- [ ] Risks identified with mitigation strategies
- [ ] Stakeholder alignment achieved
- [ ] Sunset criteria defined (when to stop investing)
