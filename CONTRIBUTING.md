# Contributing to mapaPH

Thank you for your interest in contributing to mapaPH! This guide covers the basics of getting started.

## Before You Start

- Read the [Code of Conduct](./CODE_OF_CONDUCT.md). All contributors are expected to follow it.
- Check the [open issues](https://github.com/Shiiroi/mapaph/issues) to see what is already being worked on.
- If you plan a significant change, open an issue first to discuss it before submitting a pull request.

## Development Setup

**Requirements:** Node.js 18+, npm or pnpm

```sh
# Clone the repo
git clone https://github.com/Shiiroi/mapaph.git
cd mapaph

# Install dependencies
npm install

# Start the local dev server
npm run dev
```

The site will be available at `http://localhost:4321`.

## Making Changes

1. **Fork** the repository and create a branch from `main`.
   ```sh
   git checkout -b feat/your-feature-name
   ```
2. Make your changes. Follow the existing code style — Astro components, Tailwind CSS utility classes, and semantic HTML.
3. Test that your changes build cleanly:
   ```sh
   npm run build
   ```
4. Commit with a clear, descriptive message using [Conventional Commits](https://www.conventionalcommits.org/) style:
   ```
   feat: add new tool card to overview page
   fix: correct typo in Lens documentation
   docs: update contributing guide
   ```
5. Push your branch and open a **Pull Request** against `main`.

## Project Structure

Refer to [README.md](./README.md#-project-structure) for a full breakdown of the folder structure.

Key directories:
- `src/components/docs/` — documentation page content components
- `src/layouts/` — shared page layout shells
- `src/pages/docs/` — thin route wrappers for documentation pages

## Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/Shiiroi/mapaph/issues/new) with as much detail as possible — browser, OS, steps to reproduce, and expected vs actual behavior.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
