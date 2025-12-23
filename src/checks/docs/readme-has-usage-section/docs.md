# readme-has-usage-section

Checks that README.md has a usage section.

## Why

After installation, users need to know:

- Basic usage examples
- Common commands
- API overview
- Configuration options

## Examples

**Pass**: README.md has `## Usage` or `## Examples` section.

**Fail**: No usage section found.

**Skip**: No README.md file.

## How to fix

Add a usage section:

```markdown
## Usage

```javascript
import { something } from 'your-package';

something.doThing();
```

### CLI

```bash
your-cli --option value
```
```
