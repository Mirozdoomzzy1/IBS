# GitHub Pages deployment

This project is a **static client-side application**. It does not require Node, npm, React, Jekyll, or a server.

## Recommended setup

1. Extract this ZIP.
2. Upload the **contents** of this folder to the root of your GitHub repository (not the ZIP file).
3. Commit and push `index.html`, `.nojekyll`, and the other files.
4. In **Settings → Pages**, choose **Deploy from a branch**.
5. Select your branch and choose **/(root)**.
6. Save and wait for GitHub Pages to publish.

The repository root must contain:

```text
index.html
.nojekyll
css/
js/
data/
```

## If your Pages source is `/docs`

The ZIP also contains a complete copy under `docs/`:

```text
docs/index.html
docs/.nojekyll
docs/css/
docs/js/
docs/data/
```

If you choose **/(docs)** as the Pages source, upload the entire `docs` folder to the repository and make sure it exists in the branch before saving Pages settings.

## Important

Do not configure a custom Jekyll theme. Do not run a build command. The application is already built as static HTML/CSS/JavaScript.
