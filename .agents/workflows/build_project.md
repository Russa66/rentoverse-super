---
description: How to build the RentoVerse Next.js application
---
# Build Project Workflow

This project is a Next.js application that uses standard internal dependency management with npm. It supports Turbopack caching.

## Steps

1. **Install Dependencies**
   Run the following command to securely map and install all `package.json` dependencies:
   ```bash
   npm install
   ```

2. **Check Typings**
   Validate all TypeScript specifications:
   ```bash
   npm run typecheck
   ```

3. **Build Application**
   Create a production bundle tailored with optimizations:
   ```bash
   npm run build
   ```
