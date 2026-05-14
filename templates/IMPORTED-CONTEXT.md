# Imported Preparation Context

> This artifact captures non-authoritative context imported from adjacent
> planning systems. Godpowers artifacts remain the source of truth after they
> are created.

## Sources Detected

- [DECISION] Source system: [GSD / Superpowers / BMAD / other].
- [DECISION] Source path: [relative path].
- [HYPOTHESIS] Useful signal: [what this source appears to clarify].
- [HYPOTHESIS] Confidence: [high / medium / low] because [brief reason].

## Product Signals For PRD

- [HYPOTHESIS] User or persona signal: [imported detail].
- [HYPOTHESIS] Problem or outcome signal: [imported detail].
- [HYPOTHESIS] Scope or no-go signal: [imported detail].
- [OPEN QUESTION] Imported product ambiguity: [question] -- Owner: user -- Due: before /god-prd.

## Delivery Signals For Roadmap

- [HYPOTHESIS] Existing milestone or story signal: [imported detail].
- [HYPOTHESIS] Dependency or sequencing signal: [imported detail].
- [HYPOTHESIS] Done or already-built signal: [imported detail].
- [OPEN QUESTION] Imported delivery ambiguity: [question] -- Owner: user -- Due: before /god-roadmap.

## Technical Signals For Architecture And Stack

- [HYPOTHESIS] Architecture or integration signal: [imported detail].
- [HYPOTHESIS] Technology or constraint signal: [imported detail].
- [HYPOTHESIS] Risk or compliance signal: [imported detail].
- [OPEN QUESTION] Imported technical ambiguity: [question] -- Owner: user -- Due: before /god-arch.

## Use Rules

- [DECISION] Godpowers agents may use this artifact as preparation context only.
- [DECISION] This artifact must not override `.godpowers/intent.yaml`, `.godpowers/state.json`, `PROGRESS.md`, or any completed Godpowers artifact.
- [DECISION] This artifact must not override native Pillars files under `agents/*.md`.
- [DECISION] If imported context conflicts with user intent or a Godpowers artifact, the Godpowers artifact wins and the conflict becomes an open question.
- [DECISION] PRD, architecture, roadmap, and stack agents should cite imported signals as `[HYPOTHESIS]` until confirmed by Godpowers artifacts or the user.
