# ADR-0003: Causal Uplift T-Learner Meta-Modeling for Recommendations

## Status
Accepted

## Context & Problem Statement
Standard machine learning models predict Click-Through Rate (CTR) $P(\text{Watch} | \text{User}, \text{Movie})$. However, recommending movies that a user would have watched anyway (organic views) creates wasted recommendation slots and gives misleading engagement metrics. We needed to model true Incremental Value / Conditional Average Treatment Effect (CATE).

## Decision Outcome
Implemented **T-Learner Causal Meta-Learner Engine** calculating:
$$\tau(x) = E[Y(1) - Y(0) | X = x]$$

### Positive Consequences
- Separates users into 4 causal quadrants: *Persuadables*, *Sure Things*, *Lost Causes*, and *Do Not Disturb*.
- Prioritizes recommendation bandwidth on *Persuadables* (users whose watching probability increases specifically because of the recommendation).
- Eliminates recommendation bias toward already viral blockbusters.
