# `converter-site/` — the hosted browser converter

A single static page that runs this guide's **own** converters against an
instance the reader pastes in, and links every field that is not carried across
back to the mapping row that declares the loss.

[AGENTS.md](../AGENTS.md) is authoritative for the commands; this file
explains what the workspace is and why it is shaped this way.

## What it is

- **The same code the guide is generated from.** Its browser runtime imports
  `reference/src/browser/` — the facade — and nothing else from `reference/`,
  so a verdict it shows a reader is the verdict the mapping tables publish, not
  a re-implementation that can disagree with them.
- **Entirely client-side.** There is no backend, no telemetry, and no network
  call after the page loads. Everything pasted into it stays in the reader's
  browser.
- **Honest about what it is.** The footer names the guide version and the source
  commit the bundle was built from, and CI builds that stamp from the commit it
  is deploying, so a stale deployment is visible rather than silent.
- **Hand-rolled.** No framework, no router, no component library. The
  interesting behaviour lives in pure modules — `state.ts`, `view-model.ts`,
  `preselect.ts` — which is what makes it testable under `node --test` with no
  browser test tooling in the repository.

## What it is not

- **Not part of the IG build.** The guide and its publishing tools live in a
  separate repository.
- **Not a published package.** It is `"private": true`; its version field is a
  placeholder, not a released npm package.
- **Not a second source of mapping truth.** It authors no mapping fact, no
  category page, and no anchor id. Every one of those comes from `reference/`.

## Commands

Run from this RI repository's root. The generators read version metadata from
the external guide. `MAPPING_IG_ROOT` must point to an absolute checkout path
containing `sushi-config.yaml` and `input\pagecontent`; see the root
[README.md](../README.md) for the compatible revision.

```powershell
$env:MAPPING_IG_ROOT = 'C:\path\to\data-type-mapping-ig'
npm --prefix converter-site ci
npm --prefix converter-site run generate
npm --prefix converter-site run typecheck
npm --prefix converter-site test
npm --prefix converter-site run build
```

`npm --prefix converter-site run preview` generates its inputs, rebuilds on
change, and serves `dist/` for a local look. The guide is a build-time input
only; browser conversion never reads it or sends instances over the network.

## The generated-module rule

`src/generated/` is **generated and git-ignored**, and hand-editing it is
pointless — the next command destroys the edit. It holds two modules:

- `fixture-catalog.ts` — the published worked examples, read verbatim from
  `reference/fixtures/` as raw text so what a reader edits is byte-for-byte what
  the guide publishes.
- `provenance.ts` — the guide version from the external checkout's
  `sushi-config.yaml`, the RI commit from `git rev-parse`, and the guide base URL (the canonical
  `http://hl7.org/fhir/uv/openehr-data-type-mapping/`, overridable at build time
  with `GUIDE_BASE_URL`).

`npm --prefix converter-site run generate` writes both, and it runs
**automatically** before `typecheck`, `test`, `build`, and `preview` through the `pre*`
hooks. `test/fixture-catalog.test.ts` and `test/provenance.test.ts` compare the
result back to its sources, so a stale module fails rather than ships.

`dist/` is likewise generated and git-ignored.

The Node-only generators use `reference/tooling/guide-root.ts` for guide access.
That helper is never imported by the browser runtime.

## One-time repository setting

Deployment needs **Settings → Pages → Source: GitHub Actions** selected once by
the repository owner. Until it is, the workflow's `build` job still passes and
only `deploy` fails, so the gap is loud and confined to publication.

`.github/workflows/converter-site.yml` is ordinary CI. It is unrelated to the
`dev-*` GitHub Integration in `AGENTS.md`, which stays `Enabled: no`.
The workflow obtains a pinned external guide checkout and checks the reference
implementation before building this site.
