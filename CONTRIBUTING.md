# Contributing to Trak

We love your input! We want to make contributing to Trak as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- TypeScript 5.0+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/your-username/trak.git
cd trak

# Install dependencies
npm install

# Build the project
npm run build

# Link for local testing
npm link

# Run tests
npm test
```

### Development Workflow

```bash
# Start development mode (auto-rebuild on changes)
npm run dev

# Test your changes
trak start
# ... make some changes ...
trak stop

# Test the dashboard
trak dev

# Test MCP server
npm run mcp-server
```

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Follow existing naming conventions
- Add type annotations for public APIs
- Use interfaces for data structures

### Code Organization

```
src/
├── commands/          # CLI command implementations
├── services/          # Core business logic
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

### Naming Conventions

- **Files**: camelCase (`sessionManager.ts`)
- **Classes**: PascalCase (`SessionManager`)
- **Functions**: camelCase (`startSession`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase with descriptive names (`SessionConfig`)

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- sessionManager.test.ts
```

### Writing Tests

- Use Vitest for testing framework
- Write unit tests for services
- Use property-based testing with fast-check for data transformations
- Mock external dependencies (OpenAI API, file system)

Example test structure:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { createSessionManager } from '../services/sessionManager.js';

describe('SessionManager', () => {
  it('should start a new session', () => {
    const sessionManager = createSessionManager();
    const session = sessionManager.startSession();
    
    expect(session.id).toBeDefined();
    expect(session.status).toBe('active');
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include examples in documentation
- Document complex algorithms and business logic

### README Updates

- Update README.md for new features
- Add examples for new commands
- Update installation instructions if needed

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Description**: Clear description of the bug
- **Steps to reproduce**: Minimal steps to reproduce the issue
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Node.js version, trak version
- **Logs**: Relevant error messages or logs

### Feature Requests

Use the feature request template and include:

- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional context**: Screenshots, mockups, etc.

## Commit Guidelines

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```
feat(dashboard): add GitHub issue creation
fix(session): handle file permission errors
docs(readme): update installation instructions
```

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run full test suite
4. Build and test distribution
5. Create release tag
6. Publish to npm (maintainers only)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Help

- **Documentation**: Check the README and docs/ folder
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (link in README)

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- Special recognition for major features or fixes

Thank you for contributing to Trak! 🚀
