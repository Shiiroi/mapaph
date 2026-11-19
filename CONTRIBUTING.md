# Contributing to mapaPH

Thank you for contributing to mapaPH. This guide explains how to set up your environment and submit pull requests.

## Before You Start

- Read the [Code of Conduct](./CODE_OF_CONDUCT.md).
- Check [open issues](https://github.com/Shiiroi/mapaph/issues) to see active work.
- Open an issue first to discuss significant changes before submitting a pull request.

## Development Setup

**Requirements:** Node.js 22.12.0 or higher, and pnpm 9 or higher.

```sh
# Clone the repository
git clone https://github.com/Shiiroi/mapaph.git
cd mapaph

# Install dependencies
pnpm install

# Start the local dev server
pnpm dev
```

Open `http://localhost:4321` in your browser.

## Making Changes

1. Fork the repository and create a branch from `main`:
   ```sh
   git checkout -b feat/your-feature-name
   ```
2. Follow the existing code style: Astro components, Tailwind CSS utility classes, TypeScript, and semantic HTML without emdash characters.
3. Verify formatting, types, build output, and content depth thresholds:
   ```sh
   pnpm format:check
   pnpm check
   pnpm build
   pnpm run audit:content
   ```
4. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/) style:
   ```text
   feat: add new tool card to overview page
   fix: correct typo in Lens documentation
   docs: update contributing guide
   ```
5. Push your branch and open a pull request against `main`.

## Project Structure

Read [README.md](./README.md#project-structure) for the full folder breakdown.

Key directories:

- `src/pages/tools/`: Built-in mapping and commuter utilities, including `zip-codes/[slug].astro`
- `src/components/docs/` and `src/pages/docs/`: Technical documentation guides and route wrappers
- `src/data/`: Static Philippine ZIP code, PSGC, and rail datasets
- `src/scripts/`: Client-side interactive application logic
- `src/layouts/`: Shared page layout shells
- `scripts/`: Data synchronization and post-build content audit scripts
- `supabase/migrations/`: SQL schemas for Phase 2 live telemetry

## Reporting Issues

[Open an issue](https://github.com/Shiiroi/mapaph/issues/new) with your browser, operating system, steps to reproduce, and expected versus actual behavior.

## License

By contributing, you agree that your contributions use the [MIT License](./LICENSE).
