# Major Dependency Upgrade Strategy & Migration Guide

This guide details the isolated upgrade strategy for major version transitions across the CollabLearn codebase. As recommended, each track must be executed and verified as an independent change to prevent cascading regressions.

---

## Upgrade Tracks Overview

```mermaid
graph TD
    subgraph Track 1: Database Stack
        M9[mongoose 8 to 9]
        D7[mongodb 6 to 7]
        MMS11[mongodb-memory-server 10 to 11]
        R6[redis 5 to 6]
    end

    subgraph Track 2: AI & Cloud Auth
        O7[openai 6 to 7]
        G11[google-auth-library 10 to 11]
    end

    subgraph Track 3: Frontend Build Stack
        V8[vite 7 to 8]
        VR6[@vitejs/plugin-react 5 to 6]
        GP4[@google-pay/button-react 3 to 4]
        RO13[@react-oauth/google 0.12 to 0.13]
    end

    subgraph Track 4: Tooling & Linters
        E10[eslint 9 to 10]
        EH7[eslint-plugin-react-hooks 5 to 7]
        C10[concurrently 8 to 10]
        LS17[lint-staged 16 to 17]
    end
```

---

## Track 1: Database & Storage Stack

**Packages**: `mongoose` (8 → 9), `mongodb` (6 → 7), `mongodb-memory-server` (10 → 11), `redis` (5 → 6).

### Key Breaking Changes

1. **Mongoose 9**:
   - Stricter schema cast error handling.
   - Deprecated callback syntax completely removed (only async/await or Promises allowed).
   - Changed default index creation behavior (`autoIndex` defaults to false in production).
2. **MongoDB 7**:
   - Connection string parsing deprecates older query parameters like `useNewUrlParser` and `useUnifiedTopology` (already handled in `server/src/db.js`).
   - Node 18+ strict requirement.
3. **MongoDB Memory Server 11**:
   - Automatic binary download caching directory adjustments in CI/CD environments.
4. **Redis 6**:
   - Client connection lifecycle changes (`createClient` disconnect and reconnect events require explicit event listeners).

### Step-by-Step Upgrade Steps

```bash
# 1. Update server package.json
npm install --prefix server mongoose@^9.0.0 mongodb@^7.0.0 redis@^6.0.0
npm install --prefix server --save-dev mongodb-memory-server@^11.0.0

# 2. Run database health and unit tests
npm run test:server
node server/scripts/ping-db.js
```

---

## Track 2: AI & Authentication SDKs

**Packages**: `openai` (6 → 7), `google-auth-library` (10 → 11).

### Key Breaking Changes

1. **OpenAI 7**:
   - Streaming API interface updates and standardized error classes.
   - Default HTTP client behavior updates with custom fetch support.
2. **Google Auth Library 11**:
   - Stricter token audience verification in `OAuth2Client.verifyIdToken()`.
   - Updated certs caching mechanics.

### Step-by-Step Upgrade Steps

```bash
# 1. Install new SDKs
npm install --prefix server openai@^7.0.0 google-auth-library@^11.0.0

# 2. Verify with AI pipeline and smoke test
node --test server/test/aiPipelineService.test.cjs
node server/scripts/deep-api-smoke.js
```

---

## Track 3: Frontend Build & UI Stack

**Packages**: `vite` (7 → 8), `@vitejs/plugin-react` (5 → 6), `@google-pay/button-react` (3 → 4), `@react-oauth/google` (0.12 → 0.13).

### Key Breaking Changes

1. **Vite 8**:
   - Rolldown integration preview / new module resolution defaults.
   - CSS lightningcss alignment changes.
2. **@vitejs/plugin-react 6**:
   - React 19 JSX runtime optimizations.
3. **@google-pay/button-react 4**:
   - Updated payment data request schema with Google Pay API v2.

### Step-by-Step Upgrade Steps

```bash
# 1. Install frontend packages
npm install --prefix client vite@^8.0.0 @vitejs/plugin-react@^6.0.0 @google-pay/button-react@^4.0.0 @react-oauth/google@^0.13.0

# 2. Verify build and client unit tests
npm run test:client
npm run build
```

---

## Track 4: Monorepo Tooling & Linters

**Packages**: `eslint` (9 → 10), `eslint-plugin-react-hooks` (5 → 7), `concurrently` (8 → 10), `lint-staged` (16 → 17).

### Key Breaking Changes

1. **ESLint 10 & ESLint Plugin React Hooks 7**:
   - Flat configuration is the exclusive default; legacy `.eslintrc` files are fully deprecated.
   - React 19 compiler-aware hook rules.
2. **Lint-staged 17**:
   - Config file lookup rules tightened for monorepos (our root `package.json` config is already structured for this).

### Step-by-Step Upgrade Steps

```bash
# 1. Install root tooling packages
npm install --save-dev concurrently@^10.0.0 lint-staged@^17.0.0
npm install --prefix client --save-dev eslint@^10.0.0 eslint-plugin-react-hooks@^7.0.0

# 2. Verify formatting and linting
npm run lint
npm run format:check
```

---

## Verification & Rollback Plan

If any track fails CI or testing:

1. Revert the dedicated branch or commit for that single track:
   ```bash
   git revert <commit-hash>
   ```
2. Re-run `npm install` and verification:
   ```bash
   npm install && npm run test && npm run build
   ```
