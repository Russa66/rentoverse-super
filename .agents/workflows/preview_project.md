---
description: How to start the preview server and test the UI
---
# Preview Project Workflow

This workflow will launch the active development server loaded with Next.js Turbopack enhancements.

## Steps

1. **Verify Dependencies**
   It's a good practice to ensure Node Modules are installed:
   ```bash
   npm install
   ```

2. **Start Development Server**
   Start the Turbopack server dynamically configured to handle hot reloads via Vite-style speed optimizations:
   ```bash
   npm run dev
   ```

3. **Test Application**
   The server will yield a local loopback link (e.g. `http://localhost:9002`). Open this URL in the IDE's built-in previewer or standard browser.
