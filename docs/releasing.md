# Versioning and releases

The projects in this repository have separate release cycles. Version each independently using Semantic Versioning (`MAJOR.MINOR.PATCH`); while a project is in `0.x`, minor versions may include incompatible changes. Do not imply that a project is released merely because its source is present.

## Changelogs and tags

- **Personal Workbench:** maintain `personal-workbench/CHANGELOG.md`; its existing `0.1.0` entry records the first project release.
- **Memento:** maintain `memento/CHANGELOG.md` when its first release is planned. Until then, keep implementation and validation status in its README and validation document.
- **VOOC:** maintain `vooc/macos/CHANGELOG.md` for releases of the runnable macOS app. Design previews are not app releases.

Use project-scoped tags such as `personal-workbench/v0.1.1`, `memento/v0.1.0`, and `vooc/v0.1.0`. The existing unscoped `v0.1.0` tag is historical and belongs to Personal Workbench; keep its target unchanged. Tags identify source commits. A GitHub Release is a separate set of notes and optional files attached to a tag; creating one does not change the tagged source.

Use a prerelease suffix such as `memento/v0.2.0-beta.1` when inviting limited testing before a stable release. Mark the matching GitHub Release as a prerelease and state what is incomplete. Do not use prerelease tags as stable downloads.

## Release checklist

1. Confirm the intended project, current version, and user-visible changes. Update that project's changelog and README if its behavior or requirements changed.
2. Run that project's full documented CI checks on the exact commit. For Memento, require Core tests, generated-project consistency, and Xcode simulator/UI tests before claiming an iOS build is validated.
3. Build only the artifacts that project intends to distribute. Open or install each artifact on its supported platform, verify its version and contents, and record checksums for files offered for download. Do not upload signing credentials or private provisioning profiles.
4. Create an annotated, project-scoped tag at the validated commit, for example:

   ```bash
   git tag -a personal-workbench/v0.1.1 -m "Personal Workbench 0.1.1"
   ```

5. Review the tag target and changelog, then create a GitHub Release for that exact tag. Include concise release notes and attach only verified artifacts.
6. After publishing, verify the release page, tag commit, download links, and checksums from a clean browser/session.

## Manual workflow design

Releases must be a deliberate maintainer action, never an automatic consequence of an ordinary push. If a release workflow is added later, use `workflow_dispatch` with a project and version input; reject a tag that already exists; run the same project checks required by its CI; create a draft release for review; and publish only after the selected commit and artifacts have been verified. The release job must not replace or bypass project CI. This repository currently has no automated release workflow or signing setup.

## Failed or corrected releases

If checks fail before tagging, fix the issue and rerun them on the intended commit. If a draft release is wrong, correct or discard the draft before publication. Never force-move or rewrite a published tag. If a published source tag is incorrect, document the problem and publish a corrected follow-up version rather than changing history; replace a bad release asset only with a verified file for the same tagged source.

## License decision

No license has been selected for this repository. Do not publish a license file or represent the projects as open source until the owner has chosen terms.
