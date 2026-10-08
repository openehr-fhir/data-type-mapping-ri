# AGENTS.md

Canonical, machine-readable conventions for automated agents working in
**data-type-mapping-ri**. This file is the single source of truth that the
`.github/skills/dev-*` skills read before naming any build, test, or lint
command.

**Precedence.** This file is authoritative for commands, conventions, and
invariants an agent must follow. [`README.md`](README.md) is authoritative
for rationale, configuration reference, and operational detail, and is the
place to look for the "why". If this file contradicts the repository itself,
the repository wins — fix this file.

---

## What this repository is

This repository contains the TypeScript reference implementation, mapping
ledger, fixtures, renderer, and client-side converter for openEHR / FHIR R5
data type mapping. The implementation guide is a separate repository,
accessed explicitly through `MAPPING_IG_ROOT`; this is not a SUSHI project.
The openEHR RM and FHIR R5 specifications are authoritative: document losses
rather than redefining either standard or inventing target data.

---

## Repository layout

| Path | Contents |
|-|-|
| `reference/ledger/` | The mapping facts and citations, one module per category. |
| `reference/src/model/` | The single type model, loader, and ledger validation. |
| `reference/src/convert/`, `reference/src/shared/`, `reference/src/types/` | Reference converters, shared rules, and minimal wire types. |
| `reference/src/browser/` | JSON-serialisable public browser contract and conversion facade. |
| `reference/src/publish/guide-links.ts` | Single declaration of guide pages, labels, and anchors. Browser-safe. |
| `reference/fixtures/` | Paired JSON examples and explicit one-directional pairing markers. |
| `reference/content/`, `reference/render/` | Open items and managed-region rendering. |
| `reference/tooling/guide-root.ts` | Node-only validation of the explicit external guide checkout. |
| `reference/test/` | Converters, ledger, fixtures, rendering, and external-guide integration checks. |
| `converter-site/src/` | Browser application; no backend or telemetry. |
| `converter-site/scripts/`, `converter-site/test/` | Generators, esbuild entry point, and tests. |
| `.github/workflows/converter-site.yml` | Both workspaces' CI gates and GitHub Pages deployment. |
| `.github/skills/`, `.github/agents/` | Canonical dev skills and shared agent roles; refresh through dev-setup. |
| `scratch/` | Local development slots; ignored. |

`node_modules/`, `converter-site/src/generated/`, `converter-site/dist/`,
and optional `.guide/` are ignored. Never hand-edit generated modules or
bundles. The external guide owns its narrative and `sushi-config.yaml`;
do not copy them into this repository.

---

## Toolchain pins

- **Node.js 24 or newer** is the documented development runtime. CI selects
  major `24` in `.github/workflows/converter-site.yml`, not an exact patch.
  Native TypeScript type stripping runs sources and tests directly.
- **npm** has no exact version pin. Each workspace is private and owns a
  committed lockfile. Use `npm ci` for restoration; do not replace lockfiles
  or float dependency versions merely to bootstrap a checkout.
- Both `tsconfig.json` files enable `strict`, `noUncheckedIndexedAccess`,
  `erasableSyntaxOnly`, `verbatimModuleSyntax`, explicit `.ts` imports,
  and `noEmit`. `tsc` checks types; it does not build JavaScript.
- Reference dev dependencies are TypeScript, Node types, and `yaml`. The
  browser workspace additionally uses esbuild. No runtime npm dependency
  is needed by the converters.
- **No SUSHI, Java, Ruby, or IG Publisher** is needed for the RI gates.
  Publishing the guide is a separate repository's operation.

### Required setup

`MAPPING_IG_ROOT` must be an absolute path to the external guide, containing
`sushi-config.yaml` and `input\pagecontent`. See README for the compatible
revision and fresh-checkout instructions. Missing or invalid configuration
fails explicitly; guide checks must not silently skip.

```powershell
$env:MAPPING_IG_ROOT = 'C:\path\to\data-type-mapping-ig'
npm --prefix reference ci
npm --prefix converter-site ci
```

Set the variable in every new shell. `.env` is not loaded. CI obtains the
guide with a separate pinned checkout and sets the variable itself.
Type errors fail the gate; there is no separate warnings-as-errors switch
or lint suppression policy.

---

## Build

### Reference type gate

```powershell
npm --prefix reference run typecheck
```

There is no emitted reference build: Node executes the TypeScript directly.

### Browser type gate and bundle

```powershell
npm --prefix converter-site run typecheck
npm --prefix converter-site run build
```

The `pretypecheck` and `prebuild` hooks regenerate the fixture catalogue
and provenance. The expected baseline is exit 0, no type diagnostics, and
`converter-site/dist/` containing `index.html`, `main.js`, and `styles.css`.
Both tracks work on Windows and on CI's Linux runner.

### Guide integration

```powershell
npm --prefix reference run render:check
```

This read-only drift gate compares the external guide's managed regions to
the RI's ledger. Expected: exit 0 and all regions up to date.

```powershell
npm --prefix reference run render
```

**This writes to `MAPPING_IG_ROOT\input\pagecontent`, outside this repo.**
Only run it when guide changes are intended and authorised. Review and
commit the guide's changes separately. It does not build the published IG.

---

## Test

Both workspaces use Node's built-in `node:test` runner, not Jest or Vitest.
The full reference suite includes external-guide checks and requires
`MAPPING_IG_ROOT`. The browser suite regenerates its inputs through `pretest`
and also requires that variable. Expected: zero failures.

### Full suite

```powershell
npm --prefix reference test
npm --prefix converter-site test
```

### Scoped — one workspace or file

```powershell
npm --prefix reference test
node --test reference\test\roundtrip.test.ts
```

Use the relevant workspace command above; there is no root npm workspace
or root `npm test`. Individual conversion tests do not need the guide unless
they import guide-integration helpers.

### Focused — one test name

```powershell
node --test --test-name-pattern="guide access" reference\test\guide-root.test.ts
npm --prefix converter-site test -- --test-name-pattern="guideVersion"
```

Node's filter is `--test-name-pattern`, not `-t`. For direct browser test
invocations, first run `npm --prefix converter-site run generate` so the
ignored generated modules exist.

**Prefer the smallest command that covers the change.** Escalate to the full
suite only when the focused run indicates you need to.

`reference/test/cite-local.test.ts` additionally needs both local
specification mirrors; `openehr-vocabulary.test.ts` needs openEHR alone:

```powershell
$env:OPENEHR_SPEC_DIR = 'C:\path\to\openEHR'
$env:FHIR_R5_DIR = 'C:\path\to\fhir-r5'
npm --prefix reference test
```

Without these mirrors, those tests report skips. A publication gate must
set both and require zero skipped tests. CI intentionally omits the mirrors
and is not that publication gate.

A converter or ledger change needs reference typecheck and tests plus
`render:check` when published output changes. Browser facade or guide-link
changes need both workspaces' typechecks and tests, the site build, and
`render:check`. Keep all existing contract checks during extraction work.

---

## Lint / format

There is no separate linter, formatter, or format script. Do not invent a
command or add tooling for a formatting preference. Typecheck and the
existing tests are the code gates.

---

## Run

With dependencies restored and `MAPPING_IG_ROOT` set:

```powershell
npm --prefix converter-site run preview
```

`prepreview` generates the inputs; esbuild serves `dist/` and prints the
local URL. `GUIDE_BASE_URL` optionally overrides the published guide root
at generation time. There is no backend, service, or product CLI.

---

## Code style

No formatter configuration is authoritative. Match existing TypeScript:
two-space indentation, single-quoted strings, semicolons, and explicit
`.ts` imports. Type-only imports must use `import type`.

- Use UTF-8 and final newlines. `.gitattributes` enables automatic Git text
  normalization; preserve surrounding line endings when editing.
- Prefer discriminated unions and guards to unchecked casts. Do not
  duplicate the model or cast away fidelity invariants.
- JSON and YAML use two-space indentation. Markdown is human-maintained
  except for explicitly marked generated regions in the external guide.
- Match the surrounding file. Consistency with neighbouring code beats any
  general preference.

### Architectural invariants

These are decisions, not preferences. Violating one is a review Blocker.

- **Mapping facts have one source:** `reference/ledger/`, shaped by
  `reference/src/model/`. Every row cites the published openEHR and FHIR R5
  specifications and declares fidelity in both directions. Every lossy
  verdict names exactly what is lost; never invent mandatory target data.
- **Conversion issues are observable:** preserve `MappingResult`, its
  fidelity, absent-value semantics, and composed issue propagation.
  Undecided terminology-format candidates remain unregistered and have
  no implicit default.
- **Fixtures substantiate claims.** Paired examples must be producible by
  the converters modulo declared drops. A one-directional `.pairing.json`
  must name directions and a reason; excluded directions must still fail
  to produce the partner.
- **Browser runtime imports only the facade** in `reference/src/browser/`.
  Do not reach into ledger or registry internals from site runtime code.
  Node-only build scripts may use `reference/tooling/guide-root.ts`;
  never introduce it or any `node:` import into the browser dependency graph.
- **Guide links have one source:** `reference/src/publish/guide-links.ts`.
  A fragment is allowed only when the renderer emits that anchor.
- **Guide access is explicit:** all Node tooling that reads guide files
  resolves them through `guideRoot()`. Do not add machine-specific paths,
  copy guide content here, or silently assume a sibling checkout.
- **Managed regions are generated.** Preserve their existing sentinel
  strings, and never hand-edit their bodies. A renderer and its external
  guide region must be coordinated; neither may be orphaned.
- **No generated files in commits:** regenerate the site catalogue,
  provenance, and bundle instead. Keep browser conversion client-side.
- **Documentation exploration stays documentation-only.** `dev-explore`
  may write its own slot artifacts and manifest-listed documentation
  output, never application code, dependencies, configuration, or git
  history. Static HTML assets are part of the documentation deliverable.
  Exploration and implementation slots are separate.

---

## Commit conventions

- This new repository has no established commit history or enforced
  conventional-commit types. Use clear imperative subjects; do not invent
  Jira tickets, issue numbers, or release versions.
- No project-specific trailers are required. Preserve attribution required
  by the contributing tool.
- One logical change per commit.
- When the GitHub integration below is on **and** the slot carries an
  `Issue` binding, `dev-do` adds an `Issue: #N` trailer to each phase
  commit, in addition to every trailer required above. When the
  integration is off or the slot is unbound, nothing is added.
- Agents **do not push** and **do not open pull requests** unless the user
  explicitly asks.

---

## GitHub Integration

**Off by default, in two independent ways.** A repository whose
`AGENTS.md` has **no** `## GitHub Integration` section is off. A section
whose `Enabled` row says **`no`** is equally off. In either case no skill
prompts about GitHub, and the `dev-*` loop behaves exactly as it did
before this feature existed.

The block below is **machine-managed**. This section is the **normative
definition** of both sentinel strings: every skill that reads or writes
the block reproduces the opener and the closer byte-for-byte from here,
and no skill re-derives, paraphrases, or reformats them.

<!-- >>> dev-* github integration (managed by dev-* skills) >>> -->
| Setting | Value |
|-|-|
| Enabled | no |
| Repository | n/a |
| Label — feature request | n/a |
| Label — bug report | n/a |
| Label — docs-only (additive) | n/a |
| Changelog file | n/a |
| Changelog entry format | n/a |
| PR opens as draft | n/a |
<!-- <<< dev-* github integration (managed by dev-* skills) <<< -->

**These sentinels are not `dev-setup`'s ignore-file sentinels.** The
ignore-file block that `dev-setup` maintains in `.gitignore` or
`.git/info/exclude` is delimited by
`# >>> dev-* skills (managed by dev-setup) >>>` and
`# <<< dev-* skills (managed by dev-setup) <<<`. That is a **different
block in a different file**, with a `#` comment prefix rather than an
HTML comment. Do not conflate the two, and never substitute one pair for
the other.

Rules for the block:

- Only `dev-setup`, `dev-issue`, and `dev-pr-open` may rewrite it, and
  only **in place** — never a second copy, never appended to the end of
  the file.
- Hand-written text outside the sentinels is never touched. Everything a
  human writes in this section survives every rewrite.
- A recorded value of `no`, `none`, or `n/a` is a **resolved answer**, not
  a missing one. It must never re-trigger a prompt on a later run.
- When `Enabled` is `no`, every other row is `n/a`.

---

## Scratch / slot convention

Local inner-loop work is organized into **slots** under `scratch/`:

```
scratch/<MMDD>-<##>/
  featurerequest.md    # authored by the dev-request skill
  bugreport.md         # authored by the dev-report skill
  approach-a.md        # authored by dev-approach (minimum change)
  approach-b.md        # authored by dev-approach (cleanest architecture)
  approach-c.md        # authored by dev-approach (unconstrained)
  approach.md          # authored by dev-approach (the judge's selection)
  plan.md              # authored by dev-plan, updated by dev-do
  analysis.md          # authored by dev-review
```

Use a **separate exploration slot** for `dev-explore`:

```text
scratch\<MMDD>-<##>\
  request.md           # Workflow: dev-explore; options, state, manifest
  approaches.md        # competing documentation shapes and selection
  sources.md           # source inventory and evidence map
  outline.md           # pages, sections, and question coverage
  review.md            # review of the current deliverable
  output\              # default generated documentation directory
    README.md          # Markdown entry, or index.html for HTML
```

`dev-explore` owns these artifacts, never calls the implementation or
publishing loop, and never commits. `output` may explicitly name a
dedicated documentation directory outside scratch; it must be empty or
already owned by that exploration. Existing manual edits are protected.
An exploration carries no `Issue` binding.

- `<MMDD>` is the local date (zero-padded month + day); `<##>` is a
  zero-padded two-digit slot number.
- `scratch/` is **ignored** by `/scratch/` in `.gitignore`. Nothing in it
  is ever committed. Skills and agents use shared `include` mode.
- Because the slot is ignored, **no plan phase may declare a `scratch/` path
  as an owned path.** `plan.md` is a control file that `dev-do` edits
  continuously and never stages or commits.

---

## Agent guardrails

- Read this file before proposing any build, test, or lint command. **Never
  invent a command.** If something you need is not documented here, say so
  rather than guessing.
- Subagents follow the **subagent model policy** recorded below.
- `dev-explore` defaults to automatic decisions and uses the same model
  policy. Explicit per-run model selections do not rewrite this file.
  Its concurrency and total-child budgets include rechecks and retries;
  resuming does not reset cumulative spend.
- Do not add new linting, building, or testing tooling without being asked.
- Prefer the smallest targeted verification that covers the change; escalate
  to the full suite only when the targeted run indicates it is needed.
- Do not modify the external guide during verification; `render:check`
  and tests are read-only. An intentional `render` writes outside this
  repository and needs that scope to be clear.
- Never stage, commit, or push either repository merely to complete setup.
- Installed skills are an immutable copy of the recorded canonical
  revision in README. Refresh through `dev-setup`; do not patch copies.

### Subagent model policy

Every `dev-*` skill that fans out reads this table before it spawns
anything, and each skill classifies its own roles as **reasoning** or
**mechanical**. **An absent or unreadable table means `uniform`** — the
conservative default, and the behavior every repo had before this table
existed.

| Setting | Value |
|-|-|
| Policy | tiered |
| Mechanical-tier model | gpt-5-mini |

- **`uniform`** — every sub-agent runs the spawning agent's model
  configuration, whatever its role.
- **`tiered`** — a sub-agent in a **reasoning** role runs the spawning
  agent's configuration. Prefer the lightweight built-in `explore` and
  `task` agents for mechanical roles; use the recorded mechanical-tier
  model as the fallback where those built-ins do not cover the role.

The role classification lives in the skills, not here: it is a property
of the loop and does not vary between repositories. Only the policy and
the model id do, which is why they are the two rows recorded.

A recorded value here is a **resolved answer**. `dev-setup` asks once and
never re-prompts, exactly as it treats the GitHub integration block.
