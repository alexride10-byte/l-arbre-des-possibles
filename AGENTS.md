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
- Storage and AI go through interfaces in `src/lib/services.ts` — so a local store / local AI can be plugged in later without touching UI.
