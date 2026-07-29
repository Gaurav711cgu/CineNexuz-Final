# CineNexus — UI Overhaul + Content Expansion + OTT Redirect (Plan)

## 1) Objectives
- Fix broken **Genre** and **Language** browsing (no more empty pages due to filter/routing mismatches).
- Scale catalog to **3,000–4,000** movies with a safe, rate-limited **mega ingest** pipeline and DB indexes.
- Eliminate missing posters via **TMDB images fallback** + robust frontend poster handling.
- Deliver a **cinematic, premium (Netflix-inspired)** UI refresh for Language/Genre/Studio cards per `/app/design_guidelines.md`.
- Ship a polished **“Where to Watch”** experience with OTT provider logos + outbound redirects.

## 2) Implementation Steps

### Phase 1 — Core Flow POC (Isolation) ✅ must pass before UI work
Core = “Browse by Genre/Language → movies list returns correctly” + “Mega ingest can scale safely”.

**User stories (POC)**
1. As a user, when I click a Language card, I see movies for that ISO code (e.g., `hi`) instead of an empty page.
2. As a user, when I click a Genre card, I see movies for that exact genre (correct casing/spaces) instead of an empty page.
3. As a developer, I can run a one-command mega ingest to reach a target (e.g., 3000) without hitting TMDB rate limits.
4. As a developer, I can confirm DB indexes exist and queries remain fast as the catalog grows.
5. As a user, posters never render as broken/empty tiles.

**Steps (execute in the user-required exact order)**
1. **Backend filter correctness**: Fix `/api/movies` to filter by `original_language` (ISO 639-1) and by `genres` (exact string match). Remove/avoid `query["language"]` mismatch.
2. **Frontend routing correctness**: Ensure Language/Genre pages route using ISO code / exact genre string (encode spaces), and that rails/cards link to those canonical params.
3. **POC tests (no UI redesign yet)**
   - Add `scripts/poc_browse_filters.py` to hit `/api/movies?language=hi` and `/api/movies?genre=Horror` and assert non-empty results (when data exists).
   - Add `scripts/poc_mega_ingest_smoke.py` that runs ingest to a small target (e.g., 200) to validate rate limiting + upserts.
4. Fix until both scripts are stable and repeatable.

### Phase 2 — V1 App Development (scale + wire core UX)

**User stories (V1)**
1. As a user, I can browse All Genres and All Languages and see movie counts per card.
2. As a user, I can open Genre/Language pages and infinite-scroll through results quickly.
3. As an admin/developer, I can start mega ingest and monitor progress (logs/response) without freezing the server.
4. As a user, every MovieCard shows a valid poster (or a branded fallback) with no broken images.
5. As a user, I can open a Movie Detail page and see “Where to Watch” providers with clear logos and links.

**Steps (continue exact order)**
5. **Mega ingest endpoint**: Implement `POST /api/admin/ingest/mega?target=3000` (rate-limited, dedupe/upsert, multi-region/language discovery, respects TMDB 40req/10s with `asyncio.sleep(0.25)`), plus progress logging.
6. **DB indexes in lifespan**: Create/verify indexes for `tmdb_id`, `genres`, `original_language`, `popularity`, `vote_average`, and any provider fields used.
7. **Run mega ingest** in background until catalog reaches target; verify counts and sampling distribution.
8. **Poster fixes**
   - Backend ingest: if `poster_path` missing, fetch `/movie/{id}/images` and store fallback poster.
   - Frontend: implement `PosterImage` / improved `MovieCard` `getPosterUrl()` with error fallback (no empty tiles).
9. **OTT UI hookup (minimal V1)**: Wire MovieDetail “Where to Watch” to existing `/api/movies/{id}/watch-providers` and render provider chips + outbound links.

**Checkpoint testing (end of Phase 2)**
- Run backend smoke: filters, stats, mega ingest endpoint returns 200 and increases counts.
- Run frontend smoke: browse home → language → genre → movie detail → where-to-watch links.
- Call testing agent for one end-to-end pass.

### Phase 3 — Visual Overhaul (cards + rails + stats endpoints)

**User stories (polish)**
1. As a user, Language cards feel like premium “channels” with cinematic gradients and clear typography.
2. As a user, Genre cards are professional (no emojis) with counts and consistent styling.
3. As a user, Studio/Network sections show real logos (Wikimedia) with graceful fallbacks.
4. As a user, “Where to Watch” feels JustWatch-like (grouped Stream/Rent/Buy) and easy to scan.
5. As a user, the app remains fast and readable with consistent dark-theme tokens.

**Steps**
10. **Update design tokens** in `frontend/src/index.css` to the red primary + cyan accent from `/app/design_guidelines.md`.
11. **Backend stats endpoints**
   - `GET /api/languages/stats` (ISO code + count, sorted)
   - `GET /api/genres/stats` (exact genre + count, sorted)
12. **Replace card UIs**
   - Implement `LanguageCard`, `GenreCard`, `StudioCard`, `ProviderBadge` per guidelines.
   - Update rails/pages to use stats endpoints and new cards.
13. **Upgrade Where-to-Watch UI**: group by stream/rent/buy, add provider logos + best-option CTA + mobile-friendly layout.

**Checkpoint testing (end of Phase 3)**
- Visual regression pass (no prohibited gradients, no broken layouts).
- Data correctness: card counts match filtered results.
- Call testing agent for one end-to-end pass.

### Phase 4 — Performance + Reliability (follow-ups)

**User stories**
1. As a user, pages load fast even with 4000 movies.
2. As a user, filters respond quickly and infinite scroll doesn’t stutter.
3. As a developer, watch provider lookups are cached to reduce TMDB calls.
4. As a user, provider links are consistent and don’t disappear between refreshes.
5. As an admin/developer, I can re-run ingest safely without duplicates.

**Steps**
14. Pre-cache OTT providers on startup / periodic background job (P2) + store normalized providers in DB.
15. Query tuning: confirm indexes used; add compound indexes if needed.
16. Final cleanup + docs update (what endpoints to use, how to ingest).

## 3) Next Actions (immediate)
1. Fix `/api/movies` language/genre filtering to match DB fields (`original_language`, `genres`).
2. Fix frontend routing + links so Language uses ISO codes and Genre uses exact strings.
3. Add two POC scripts to validate filters + ingest smoke.
4. Run POC scripts until stable.
5. Only then implement mega ingest and begin scaling.

## 4) Success Criteria
- Genre/Language pages consistently return results when movies exist (no “No Movies Found” due to mismatched params).
- Mega ingest reaches **3k–4k** movies with no duplicates and no TMDB rate-limit failures.
- Posters: zero broken image tiles; all missing posters show branded fallback.
- New cards (Language/Genre/Studio) match `/app/design_guidelines.md` and avoid prohibited gradients/emojis.
- Movie Detail shows a working, polished “Where to Watch” section with provider logos + outbound links.
- One full E2E smoke test passes after each phase without breaking existing AI Lab or core app flows.
