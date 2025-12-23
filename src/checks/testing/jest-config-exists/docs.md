# jest-config-exists

Checks that Jest is configured.

## Why

Jest is a popular testing framework. A config file:

- Customizes test behavior
- Configures coverage reporting
- Sets up test environments
- Integrates with TypeScript

## Examples

**Pass**: `jest.config.js` or `jest.config.ts` exists.

**Fail**: No Jest configuration found.

## How to fix

Create `jest.config.js`:

```javascript
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts']
};
```

Or initialize:

```bash
npx jest --init
```
