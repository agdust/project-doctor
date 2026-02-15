# dockerfile-small-base-image

Checks that the Dockerfile uses a small, efficient base image instead of large general-purpose images.

## Why

Large base images like `ubuntu` or `debian` can be 100MB+ and include many packages you don't need. Smaller images like Alpine (~5MB) reduce:
- Image build and pull times
- Storage costs
- Attack surface (fewer packages = fewer vulnerabilities)
- Container startup time

## Examples

**Pass**:
- `FROM node:22-alpine`
- `FROM python:3.12-slim`
- `FROM alpine:3.19`
- `FROM gcr.io/distroless/nodejs`

**Fail**:
- `FROM ubuntu:22.04` - Large general-purpose image
- `FROM node:22` - Full Node image without slim/alpine variant
- `FROM debian:bookworm` - Large base image

## How to fix

Replace large base images with smaller alternatives:

| Instead of | Use |
|------------|-----|
| `ubuntu`, `debian` | `alpine:3.19` |
| `node:22` | `node:22-alpine` |
| `python:3.12` | `python:3.12-slim` or `python:3.12-alpine` |
| `golang:1.22` | `golang:1.22-alpine` |

Example Dockerfile with Alpine:

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

CMD ["node", "dist/index.js"]
```

Note: Alpine uses `musl` libc instead of `glibc`. Most Node.js apps work fine, but native dependencies may need adjustment.
