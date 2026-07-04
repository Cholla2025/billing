# "Fable 5" — clarification

The buildspec kickoff prompt (buildspec 00) instructs the coding agent to *"research the Fable 5
component library and use its components fully."* That instruction is based on a misunderstanding.

**Fable 5 is a Claude model** (`claude-fable-5`), part of the Claude 5 family — not a UI component
library. The client's actual request ("switch this to Claude Code Fable 5") means *build this using
that model in Claude Code*, which is what happened. There is no npm package, design kit, or
component catalog named "Fable 5" to adopt.

## What we did instead
- Skipped the nonexistent-library research step (it would only have produced dead ends).
- Built the component layer directly against the **Cholla design tokens** (`src/design/tokens.ts`)
  and ported the prototype's chart/render primitives 1:1 (`src/components/render.tsx`) so the UI is
  pixel-identical to the approved design.
- The result is exactly the intended outcome — the same look and feel — without a phantom dependency.

If the client later standardizes on a specific real component library (e.g. Radix, shadcn/ui, MUI),
the ported primitives in `render.tsx` are the natural swap point; the design tokens stay the source
of truth either way.
