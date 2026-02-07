# Debug Build Issues

## Current Build Error

```
Type error: Cannot find module './routes.js' or its corresponding type declarations.
```

## Steps to Debug

### 1. Find the Offending Import

```bash
# Search for any import of './routes' or './routes.js'
grep -rn "from './routes" src/
grep -rn "import './routes" src/
grep -rn "require('./routes" src/

# Check TypeScript compilation errors directly
npx tsc --noEmit 2>&1 | grep "routes"
```

### 2. Common Culprits

The error `Cannot find module './routes.js'` usually means:
- A TypeScript file is trying to import `./routes.js` explicitly
- Next.js router configuration issue
- Auto-generated file that references routes

Check these locations:
```bash
# Check app router files
find src/app -name "*.ts" -o -name "*.tsx" | xargs grep -l "routes"

# Check middleware
cat src/middleware.ts

# Check next.config
cat next.config.ts
```

### 3. Quick Fix Options

**Option A: Find and Fix**
```bash
# Get exact error location
npm run build 2>&1 | grep -B 10 "routes.js"
```

**Option B: Bypass (Temporary)**
If it's a non-critical import:
```typescript
// Change from:
import routes from './routes';

// To:
import routes from './routes'; // @ts-ignore
// or
const routes = await import('./routes').catch(() => ({}));
```

**Option C: Create Missing File**
If routes.js should exist but doesn't:
```bash
# Find what routes.ts might export
find src -name "routes.ts" -o -name "routes.tsx"

# If found, maybe rename/copy it
# If not found, create a stub
```

## Other Build Warnings

### Stripe Config Warning

```typescript
// In src/app/api/webhooks/stripe/route.ts
// The 'config' export is deprecated in Next.js App Router

// Old way (deprecated):
export const config = {
  api: { bodyParser: false }
};

// New way:
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Note: Raw body parsing needs different approach in App Router
```

## Testing Without Full Build

```bash
# Test TypeScript compilation only
npx tsc --noEmit

# Run dev server (doesn't require production build)
PORT=3002 npm run dev

# Test specific route
curl http://localhost:3002/api/whatsapp/status
```

## After Fixing

```bash
# Clean build
rm -rf .next
npm run build

# If successful, commit
git add .
git commit -m "Fix: Resolve missing routes.js import"
```
