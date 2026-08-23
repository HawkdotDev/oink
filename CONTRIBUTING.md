# Contributing to Oink

Thank you for your interest in contributing to **Oink**! We are building an open, local-first, hybrid block-markdown workspace, and community contributions are essential to making it better for everyone.

Whether you're fixing a bug, designing a new feature, improving documentation, or reporting an issue, your help is warmly welcomed.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Improving Documentation](#improving-documentation)
  - [Contributing Code](#contributing-code)
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Running in Development](#running-in-development)
- [Project Architecture](#project-architecture)
- [Coding Standards & Conventions](#coding-standards--conventions)
  - [TypeScript & Type Safety](#typescript--type-safety)
  - [Linting & Formatting](#linting--formatting)
  - [Styling & UI Aesthetics](#styling--ui-aesthetics)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Workflow](#pull-request-workflow)
- [Building & Packaging](#building--packaging)

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please be respectful, constructive, and collaborative in all discussions and interactions.

## How Can I Contribute?

### Reporting Bugs

If you find a bug or unexpected behavior:

1. **Check Existing Issues**: Search the [GitHub Issues](https://github.com/HawkdotDev/oink/issues) to verify if the issue has already been reported.
2. **Open a Detailed Issue**: If not, create a new issue using a descriptive title and include:
   - Operating System and version (e.g., Windows 11, macOS Sequoia, Ubuntu 24.04).
   - Oink version or commit SHA.
   - Clear, step-by-step instructions to reproduce the bug.
   - Expected behavior vs. actual behavior.
   - Screenshots, screen recordings, or error logs from the Developer Tools console (`Ctrl+Shift+I` or `Cmd+Option+I`).

### Suggesting Enhancements

Feature requests are always welcome! When suggesting a feature:

- Explain **why** the feature is valuable and what problem it solves.
- Describe how you envision the user experience and interface working.
- Keep in mind Oink's core principles: **local-first privacy**, **plain-text portability**, and **high performance**.

### Improving Documentation

Documentation improvements (fixing typos, clarifying setup instructions, adding code examples, or expanding guides) are great first-time contributions.

### Contributing Code

Ready to submit code? Look for issues tagged `good first issue` or `help wanted` to get started.

## Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js**: `>= 20.0.0`
- **Package Manager**: `npm`, `bun`, or `pnpm`
- **Git**: `>= 2.30`

### Local Installation

1. **Fork the repository** on GitHub: [https://github.com/HawkdotDev/oink](https://github.com/HawkdotDev/oink)
2. **Clone your fork**:
   ```bash
   git clone https://github.com/<your-username>/oink.git
   cd oink
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/HawkdotDev/oink.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```

### Running in Development

Start the Electron + Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

## Project Architecture

Oink is structured into three primary layers using `electron-vite`:

```
oink/
├── electron-builder.yml        # Distribution and installer configuration
├── electron.vite.config.ts     # Multi-target Vite configuration
├── src/
│   ├── main/                   # Electron Main process (native window lifecycle, IPC, local FS)
│   │   └── index.ts
│   ├── preload/                # Secure IPC Context Isolation bridge
│   │   ├── index.ts
│   │   └── index.d.ts
│   └── renderer/               # React 19 Client Application
│       ├── index.html          # HTML shell
│       └── src/
│           ├── assets/         # CSS tokens, base styles, branding assets
│           ├── components/     # UI components (Editor, Graph, Sidebar, Modals, Widgets)
│           ├── hooks/          # Custom React hooks & state persistence
│           ├── types/          # Shared TypeScript type definitions
│           ├── utils/          # Markdown/Frontmatter parser, wikilink extractor, path utils
│           └── workers/        # Dedicated web workers (graph parsing, async indexing)
```

- **Main Process (`src/main`)**: Handles native file system operations, window management, and native system dialogs. Keep business logic minimal here; expose security-bounded IPC channels.
- **Preload (`src/preload`)**: Safely exposes IPC handlers to the renderer window via `contextBridge`.
- **Renderer (`src/renderer`)**: Modern React 19 application managing UI components, state, block editing, and graph visualization.

## Coding Standards & Conventions

### TypeScript & Type Safety

- Use strict TypeScript everywhere. Avoid `any` types wherever possible.
- Run typechecks across all build targets before committing:
  ```bash
  npm run typecheck
  ```
  _(Runs both `npm run typecheck:node` and `npm run typecheck:web`)_

### Linting & Formatting

- Maintain code style by running ESLint and Prettier:

  ```bash
  # Check for lint issues
  npm run lint

  # Automatically fix lint issues
  npm run lint:fix

  # Format all files
  npm run format

  # Verify formatting without modifying files
  npm run format:check
  ```

### Styling & UI Aesthetics

- Oink uses a modern Brutalist dark-mode design system with Tailwind CSS 4 and scoped CSS variables.
- Keep UI responsive, clean, and accessible. Use Lucide icons (`lucide-react`) for UI iconography.
- Avoid introducing unnecessary heavy external dependencies.

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>
```

### Common Types

- `feat`: A new feature or capability
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Changes that do not affect the meaning of the code (formatting, whitespace, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or correcting tests
- `chore`: Build tasks, dependency updates, configuration changes

### Examples

- `feat(graph): add physics dampening toggle for large node graphs`
- `fix(editor): resolve markdown frontmatter serialization glitch`
- `docs: update setup instructions in CONTRIBUTING.md`

## Pull Request Workflow

1. **Create a descriptive branch**:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. **Make your changes** and test thoroughly locally.
3. **Validate code quality**:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   ```
4. **Commit your changes**:
   ```bash
   git commit -m "feat(editor): add new inline callout block"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feat/my-new-feature
   ```
6. **Submit a Pull Request** targeting the `main` branch of `HawkdotDev/oink`.
7. **Fill out the PR description** detailing what changes were made, why, and any screenshots or testing verification steps.

## Building & Packaging

To verify that desktop packaging succeeds on your machine:

```bash
# Package directory without creating installer (fast verification)
npm run build:unpack

# Build Windows installer (.exe)
npm run build:win

# Build macOS package (.dmg / .zip)
npm run build:mac

# Build Linux package (.AppImage / .deb)
npm run build:linux
```

All compiled binaries will be output to the `dist/` directory.

## Questions or Need Help?

Feel free to open an issue or start a discussion on our [GitHub Discussions / Issues](https://github.com/HawkdotDev/oink/issues).

Thank you for helping build **Oink**!
