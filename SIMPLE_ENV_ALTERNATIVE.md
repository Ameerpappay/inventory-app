# Simple Environment Setup Alternative

If you prefer an even simpler approach without the custom loader, you can use dotenv directly:

## Option 1: Direct dotenv usage (Simplest)

Replace the imports in `src/index.ts`:

```typescript
import dotenv from "dotenv";

// Load environment file based on NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: envFile });

// Optional: Load local overrides
dotenv.config({ path: ".env.local", override: true });
```

## Option 2: Current Custom Loader (More features)

The current setup in `src/config/env.ts` provides:

- Automatic environment file detection
- Environment variable validation
- Helpful startup messages
- Error handling and fallbacks

## Recommendation

**For simplicity**: Use Option 1 (direct dotenv)
**For production apps**: Use Option 2 (custom loader with validation)

The dotenv library is doing exactly what you expect:

1. Reading the .env file
2. Parsing key=value pairs
3. Setting them in process.env

The custom loader just adds convenience and safety features on top of dotenv.
