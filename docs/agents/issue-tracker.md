# Issue tracker: Local Markdown

Specifications and implementation tickets for this repository are tracked as Markdown files.

## Conventions

- Specifications live at `docs/spec/<feature-slug>.md`.
- Tickets are grouped by feature under `docs/tickets/<feature-slug>/`.
- Each ticket is stored as `docs/tickets/<feature-slug>/<NN>-<slug>.md`.
- Ticket numbering starts at `01` and remains stable.
- Ticket state is recorded as a `Status:` line near the top.
- Comments and conversation history are appended under `## Comments`.

## When a skill says “publish a spec”

Write or update `docs/spec/<feature-slug>.md`.

## When a skill says “publish to the issue tracker”

Create the next numbered ticket under `docs/tickets/<feature-slug>/`.

## When a skill says “fetch the relevant ticket”

Read the referenced ticket file. Callers should provide its path or feature and ticket number.

## Wayfinding operations

- Map: `docs/tickets/<effort>/map.md`.
- Child ticket: `docs/tickets/<effort>/<NN>-<slug>.md`.
- Type is recorded as `Type: research|prototype|grilling|task`.
- Status is recorded as `Status: open|claimed|resolved`.
- Blocking is recorded as `Blocked by: NN, NN`.
- The frontier is the first open, unblocked, unclaimed ticket by number.
- Claim by setting `Status: claimed` before beginning work.
- Resolve by adding an `## Answer`, setting `Status: resolved`, and updating the map’s Decisions-so-far.
