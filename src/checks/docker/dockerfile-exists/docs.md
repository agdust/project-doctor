# dockerfile-exists

Checks that a Dockerfile exists in the project root.

## Why

A Dockerfile enables containerization of your application, ensuring consistent environments across development, testing, and production. Containers make deployment predictable and simplify dependency management.

## Examples

**Pass**: Dockerfile exists in project root

**Fail**: No Dockerfile found

## How to fix

Create a Dockerfile in your project root:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Adjust the base image and commands to match your project's needs.
