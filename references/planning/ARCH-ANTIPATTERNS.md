# Architecture Antipatterns

## 1. Architecture Theater
Diagrams without load-bearing decisions. Boxes connected by arrows that
nobody can articulate the rationale for. Looks impressive; decides nothing.

**Fix**: For every box and every arrow, write the WHY. If you can't, delete it.

## 2. Cargo-Cult Cloud-Native
Kubernetes + Kafka + microservices for a 10-user CRUD app.

**Fix**: Match complexity to scale from PRD. If PRD says 1000 users by
month 6, monolith is fine. Don't import patterns from a scale you'll
never reach.

## 3. Stackitecture
Picking React + Postgres + Vercel and calling it architecture.

**Fix**: Architecture is system shape (services, boundaries, data flow).
Stack is tool selection. They're separate documents. Read /god-stack
after /god-arch, not instead of it.

## 4. "Scalable" Without Numbers
> "Our system is highly scalable."

**Fix**: Replace with quantification. "Handles 10K concurrent users at p99
< 200ms in a single region. Beyond that, we add read replicas (ADR-008)."

## 5. Resume-Driven Architecture
Choosing GraphQL/Kubernetes/Rust because they're trendy or because the
architect wants the experience, not because they fit.

**Fix**: Tie every choice to a PRD requirement. If you can't, drop it.

## 6. Paper-Tiger Architecture
Looks robust on paper. Breaks under first real load.

**Fix**: Every NFR gets a worst-case analysis. "Sustained 100 reqs/sec at
p99 < 200ms" needs a load test before launch, not after.

## 7. Hidden Single Points of Failure
Diagram shows redundancy at every layer EXCEPT one (the auth service, the
config server, the deploy bot).

**Fix**: For each container, ask "what happens if this dies?" If the answer
is "everything stops," it's a SPOF. Address it or document it.

## 8. ADR Without Flip Point
> "Decision: monolith. Rationale: simpler. Consequences: easier deploy."

**Fix**: Add the flip point. "Reverse this decision when [specific
condition]." Without it, the decision is forever and unfalsifiable.
