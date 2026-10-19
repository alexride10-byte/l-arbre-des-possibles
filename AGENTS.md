<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Enfance+ architecture
- Sample data lives in `src/data/`, SVG geometry in `src/lib/tree-geometry.ts`, visual components in `src/components/tree/` — keeps data, logic and visuals swappable.
- Observations persist via `src/lib/local-observations.ts` (browser localStorage, no network); swap the repository for encrypted/desktop storage later.
- Storage and AI go through interfaces in `src/lib/services.ts` — so a local store / local AI can be plugged in later without touching UI.
- Page layout pieces (profile sidebar, follow-up zone) live in `src/components/layout/`; fragility and quest sample data in `src/data/fragilities.ts` / `src/data/quests.ts` — keeps tree visuals independent of the dashboard shell.
- Tree decorative paths (bark, foliage) must stay `pointer-events: none`; only hit groups, labels and nodes receive clicks — otherwise neighbouring leaves swallow clicks.
- Shared contextual factors live in `src/data/factors.ts`; `FactorNetwork` and `FactorPanel` consume the same associations while the page retains fragility selection — returning from a factor preserves the exploration network.
- Keep the scene viewport stable during selection: a reserved desktop details column and overlay mobile sheet leave camera dimensions unchanged; ResizeObserver adapts SVG framing to the available aspect ratio.
- Fictional avatars are parametric SVG components with page-owned options shared by the profile and tree; customization is session-only and never processes photographs.
