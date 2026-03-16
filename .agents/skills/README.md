# Custom Skills Directory

This directory is dedicated to storing custom skills (instructions, templates, protocols) for the AI assistant (Antigravity).

## How to create a new skill

1. Create a subfolder for your new skill, e.g., `code-guidelines/`.
2. Inside the folder, create a `SKILL.md` file with a YAML frontmatter block containing its name and description:

```markdown
---
name: code-guidelines
description: Project specific coding standards and architectural guidelines.
---

Here are the specific rules to follow for this project:
1. Always use TypeScript
2. Follow domain driven design
...
```

3. You can also include additional files in the same folder if your skill requires them (e.g. `scripts/`, `examples/`).

The AI will automatically register these skills when working in this project.
