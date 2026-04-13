# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies for tsc)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and prisma schema
COPY src ./src
COPY prisma ./prisma

# Write a self-contained tsconfig (avoids monorepo extends path issues in Docker)
RUN printf '{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "commonjs",\n    "lib": ["ES2022"],\n    "strict": false,\n    "noImplicitAny": false,\n    "strictNullChecks": false,\n    "esModuleInterop": true,\n    "skipLibCheck": true,\n    "forceConsistentCasingInFileNames": true,\n    "resolveJsonModule": true,\n    "declaration": true,\n    "sourceMap": true,\n    "outDir": "dist",\n    "rootDir": "src",\n    "baseUrl": "."\n  },\n  "include": ["src/**/*"],\n  "exclude": ["node_modules", "dist"]\n}\n' > tsconfig.json

# Compile TypeScript
RUN npx tsc

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist
# Copy prisma schema from builder
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client in the runtime stage to match the environment exactly
RUN npx prisma generate

EXPOSE 4000

ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
