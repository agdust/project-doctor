# npm-security-devcontainer

Checks for dev container configuration for isolated development.

## Why

Dev containers isolate your development environment from your host system. If a malicious package executes code during installation, the blast radius is limited to the container rather than your entire machine.

Benefits:
- Malware cannot access files outside the container
- Each project runs in its own isolated environment
- Consistent development environment across team members
- Easy to reset if compromised

Additional hardening options:
- Drop all capabilities: `--cap-drop=ALL`
- Disable prototype pollution: `NODE_OPTIONS: --disable-proto=delete`
- Run as non-root user

Works with VS Code, GitHub Codespaces, and other container-aware IDEs.

Source: [npm Security Best Practices](https://github.com/lirantal/npm-security-best-practices)

## Examples

**Pass**: `.devcontainer/devcontainer.json` exists.

**Fail**: No dev container configuration found.

## How to fix

See the detailed guide: [Work in Dev Containers](https://github.com/lirantal/npm-security-best-practices?tab=readme-ov-file#8-work-in-dev-containers)

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "Node.js",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:22",
  "postCreateCommand": "npm ci"
}
```
