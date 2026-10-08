# openEHR / FHIR Data Type Mapping Reference Implementation

The TypeScript reference implementation (RI), mapping ledger, paired examples,
and browser converter for the
[openEHR to FHIR Data Type Mapping Implementation Guide](http://hl7.org/fhir/uv/openehr-data-type-mapping/).
Mappings target FHIR R5 and report whether each conversion is `lossless`,
`lossy`, or `unmapped`, with an issue for each field that cannot be carried.

This is the implementation repository, **not the guide source**. The narrative,
SUSHI configuration, and IG publishing toolchain remain in
[data-type-mapping-ig](https://github.com/openehr-fhir/data-type-mapping-ig).
Neither workspace is a published npm package.

## Layout

| Path | Purpose |
| --- | --- |
| `reference/ledger/` | Mapping facts, directional fidelity, and citations |
| `reference/src/` | Type model, converters, shared rules, and browser-facing facade |
| `reference/fixtures/` | Paired openEHR and FHIR JSON examples |
| `reference/render/` | Projection of the ledger into the external guide's managed regions |
| `reference/tooling/` | Node-only access to the external guide checkout |
| `reference/test/` | Conversion, ledger, fixture, rendering, and guide-integration checks |
| `converter-site/` | Entirely client-side converter and its build scripts |
| `.github/workflows/converter-site.yml` | Checks both workspaces and builds/deploys the converter |
| `.github/skills/`, `.github/agents/` | Shared development skills and agent definitions |
| `AGENTS.md` | Authoritative development commands and architectural rules |

See [reference/README.md](reference/README.md) for the conversion contract and
[converter-site/README.md](converter-site/README.md) for the browser application.

## Getting started

Use **Node.js 24 or newer** and npm. CI uses Node 24. Sources and tests execute
as TypeScript through Node's native type stripping; there is no transpilation
step for the reference implementation. Dependencies are pinned by the two
committed `package-lock.json` files.

The full test suite, renderer, and browser-site generation need an external
guide checkout. For a fresh, compatible checkout, run these PowerShell commands
from this repository's root:

```powershell
git clone https://github.com/openehr-fhir/data-type-mapping-ig.git ..\data-type-mapping-ig
git -C ..\data-type-mapping-ig switch --detach 361566d00d3467c3e5aba57ee59cb80505cda138
$env:MAPPING_IG_ROOT = (Resolve-Path ..\data-type-mapping-ig).Path

npm --prefix reference ci
npm --prefix converter-site ci
npm --prefix reference run typecheck
npm --prefix reference test
npm --prefix reference run render:check
npm --prefix converter-site run typecheck
npm --prefix converter-site test
npm --prefix converter-site run build
```

If you already have the guide, **do not replace or reset it**. Set
`MAPPING_IG_ROOT` to its absolute path instead. The path must contain
`sushi-config.yaml` and `input\pagecontent`; missing configuration is an error,
not an implicit sibling-directory lookup or a skipped integration check.
Set the variable again in each new shell; `.env` files are not loaded.

The converter and browser facade themselves do not read the external guide.
It is a development/build-time dependency, not a runtime or network dependency.
SUSHI, Java, and the IG Publisher are not required for these commands.

## Run the browser converter

With dependencies restored and `MAPPING_IG_ROOT` set:

```powershell
npm --prefix converter-site run preview
```

The command generates the fixture catalogue and provenance, builds the site,
and prints the local preview URL. Generated modules and `converter-site/dist/`
are ignored. Conversion runs in the browser; pasted data is not sent to a
server.

Set `GUIDE_BASE_URL` at build time to point links at a different published guide.
Otherwise they target the guide's canonical URL. The footer records the
external guide's version and this RI checkout's commit; before the first commit,
or in a source archive without Git metadata, the commit is honestly `unknown`.

## Updating the guide

Check for drift without modifying either checkout:

```powershell
npm --prefix reference run render:check
```

To publish ledger changes into the guide's source:

```powershell
npm --prefix reference run render
```

**`render` writes to `MAPPING_IG_ROOT\input\pagecontent`, outside this
repository.** It replaces only sentinel-delimited managed regions. Review and
commit those changes in the guide repository separately; the RI neither commits
them nor runs the IG Publisher. Existing sentinel text is preserved for
compatibility, but the render command is now run from this RI repository.

When updating the compatible guide revision, update the checkout pin in
`.github/workflows/converter-site.yml` and run the integration checks against
that revision. Do not copy guide narrative or SUSHI configuration into this repo.

## Optional specification mirrors

The reference suite checks citations and vocabulary against local copies of
the published specifications when these variables are set:

```powershell
$env:OPENEHR_SPEC_DIR = 'C:\path\to\openEHR'
$env:FHIR_R5_DIR = 'C:\path\to\fhir-r5'
npm --prefix reference test
```

Without the mirrors, those checks report skips. A publication gate requires
both mirrors and **zero skipped tests**. These variables are separate from
`MAPPING_IG_ROOT`, which the guide-integration checks always require.

## CI and deployment

The workflow checks out a pinned guide revision into ignored `.guide/`, sets
`MAPPING_IG_ROOT`, checks both workspaces, checks rendered-region drift, and
builds the static converter. It does not download the optional specification
mirrors, so CI is not the zero-skip publication gate.

Deployment on `main` uses GitHub Pages. The repository owner must select
**Settings > Pages > Source: GitHub Actions** before deployment can succeed.
The build does not require Pages to be enabled.

## Development skills

Ten portable `dev-*` skills and eight shared agent definitions are included as
committable files. Their local work goes in ignored `scratch/`. GitHub issue/PR
publishing by the skills is disabled; that setting is independent of ordinary
CI. The selected subagent policy is tiered, with `gpt-5-mini` as the mechanical
fallback.

Start a fresh Copilot CLI session after installation so the skills are
discovered. Refresh them through the canonical `dev-setup` installer rather
than editing their installed copies.

## Import provenance

| Component | Source revision |
| --- | --- |
| RI, browser converter, and CC0 license | `openehr-fhir/data-type-mapping-ig` at `361566d00d3467c3e5aba57ee59cb80505cda138` |
| Dev skills, agents, and AGENTS template | Canonical `C:\ai\git\devskills` at `307939298bfa7a6ed707cf7a978ce631a0bcd645` |

The RI was extracted from the guide on 2026-10-08. Conversion logic, mapping
facts, and paired fixtures were retained; guide-file access, repository
metadata, and CI were adapted for the split. The devskills import uses one
committed snapshot, deliberately excluding concurrent uncommitted work.

## Contributing and license

Read [AGENTS.md](AGENTS.md) before making changes. Preserve directional fidelity,
declared losses, mandatory-attribute handling, and the browser facade. The
reference implementation's known JavaScript `integer64` precision limitation
is documented in [reference/README.md](reference/README.md).

The imported implementation retains its [CC0-1.0 license](LICENSE).
FHIR is the registered trademark of HL7.
