# GitHub PAT JSON Storage

This version stores the project in `data/project.json` in the GitHub repository and uses browser localStorage only as an offline/cache copy.

## 1. Edit `js/store.js`

At the top of `js/store.js`, find `GITHUB_STORAGE` and replace:

- `YOUR_GITHUB_USERNAME` with the GitHub repository owner.
- `YOUR_REPOSITORY_NAME` with the repository name.
- `github_pat_PASTE_YOUR_TOKEN_HERE` with your GitHub Personal Access Token.

The same configuration exists in `docs/js/store.js` if the Pages source is `/docs`.

Example:

```js
const GITHUB_STORAGE = {
  owner: "mygithubuser",
  repo: "enterprise-system-design-studio",
  branch: "main",
  path: "data/project.json",
  token: "github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
};
```

## 2. Token permissions

For a fine-grained PAT, grant access only to this repository and give **Contents: Read and write** permission. Do not grant unnecessary permissions.

## 3. Important security warning

Because the PAT is hard-coded into browser JavaScript, it is visible to anyone who can load the website. Anyone with the token may be able to modify the repository within the permissions granted to the token. This is intentionally done because the requested design is client-side GitHub storage.

For a public website, use a dedicated repository and a narrowly scoped token. If the token is ever exposed outside your intended users, revoke it and create a replacement.

## 4. How saving works

- On startup, the app tries GitHub first.
- If GitHub is unavailable, existing local data remains available.
- Every project change updates localStorage immediately and schedules a GitHub save.
- Saves are debounced so rapid editing does not create a commit for every keystroke.
- The GitHub file SHA is checked before writing. If another device changed the file, the app reports a conflict instead of silently overwriting it.
- The public `data/project.json` remains a fallback/bootstrap file.
