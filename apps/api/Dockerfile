# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for tsc)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY src ./src

# Write a self-contained tsconfig (avoids monorepo extends path issues in Docker)
RUN printf '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "commonjs",\n    "lib": ["ES2022"],\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true,\n    "resolveJsonModule": true,\n    "declaration": true,\n    "sourceMap": true,\n    "outDir": "dist",\n    "rootDir": "src",\n    "baseUrl": "."\n  },\n  "include": ["src/**/*"],\n  "exclude": ["node_modules", "dist"]\n}\n' > tsconfig.json

RUN npx tsc

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
