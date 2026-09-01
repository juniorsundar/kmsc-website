# Domain Docs

How engineering skills consume this repository’s domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repository root.
- Relevant ADRs under `docs/adr/`.

If either location is absent, proceed silently. Domain documentation is created lazily when terminology or consequential decisions are resolved.

## Layout

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

## Use the glossary’s vocabulary

Use domain concepts exactly as defined in `CONTEXT.md`. Do not drift to synonyms that the glossary explicitly avoids.

If a required concept is missing, reconsider whether it belongs to the domain or note the gap for domain-modeling work.

## Flag ADR conflicts

Surface any proposal that contradicts an existing ADR rather than silently overriding it.
