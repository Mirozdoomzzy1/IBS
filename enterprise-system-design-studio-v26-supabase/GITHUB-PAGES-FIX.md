# GitHub Pages startup fix

This release fixes the startup crash caused by missing date utility functions (`addDays`, `isoDate`, `fmtDate`, `businessDays`, and `timelineWeeks`).

## Recommended Pages configuration

Use **Settings → Pages → Deploy from a branch → main → /(root)**.

The root `index.html` is self-contained and the `/docs` folder is also kept synchronized for projects that choose `/docs` as their Pages folder.

After replacing the files in GitHub Pages, use a hard refresh (Ctrl+F5) once so an older cached JavaScript bundle is not reused.
