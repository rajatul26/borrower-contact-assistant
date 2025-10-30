# GitHub Codespaces Setup

This project ships with a ready-to-use Codespaces configuration that spins up a containerized Node.js environment tailored for Vite + React development.

## First Launch

1. Open the repository in a new Codespace.
2. Wait for the container build to finish. The `postCreateCommand` will run `npm install` automatically.
3. Once the terminal prompt is ready, start the dev server:

   ```bash
   npm run dev -- --host
   ```

   The `--host` flag makes Vite listen on all interfaces so Codespaces can forward the port.

4. Codespaces will detect port `5173` and offer to open the preview in a browser tab.

## What’s Included

- **Base image:** `mcr.microsoft.com/devcontainers/typescript-node:20`
- **VS Code extensions:** ESLint, Prettier, Tailwind CSS IntelliSense
- **Ports:** 5173 auto-forwarded with an “open in browser” prompt
- **Default user:** `node`

If you want to customize the environment (e.g., install global tools), update `.devcontainer/devcontainer.json` and rebuild the container from the Command Palette (`Codespaces: Rebuild Container`).

Happy coding!
