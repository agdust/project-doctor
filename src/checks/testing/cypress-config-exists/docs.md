# cypress-config-exists

Checks that Cypress is configured.

## Why

Cypress provides end-to-end testing with:

- Real browser testing
- Time-travel debugging
- Automatic waiting
- Network stubbing
- Screenshot/video recording

## Examples

**Pass**: `cypress.config.ts` or `cypress.config.js` exists.

**Fail**: No Cypress configuration found.

## How to fix

Install and initialize Cypress:

```bash
npm install -D cypress
npx cypress open
```

Or create `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
  },
});
```
