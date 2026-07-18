# mapaPH Hub

**mapaPH** is an open-source platform of mapping utilities built for the Philippines. This repository contains the **hub website** — the central landing page and documentation site for all mapaPH tools.

> The individual tools (e.g. Lens) live on their own subdomains and repositories.

---

## Tools

| Tool         | Status         | URL                                        |
| :----------- | :------------- | :----------------------------------------- |
| **Lens**     | Active         | [lens.mapaph.com](https://lens.mapaph.com) |
| **To-Cubao** | In Development | —                                          |
| **Compaws**  | In Development | —                                          |

---

## 🚀 Project Structure

This site is built with [Astro](https://astro.build) on top of the minimal starter template.

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── docs/          # Documentation page content components
│   │   └── ...            # Shared UI components (Navbar, Footer, etc.)
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── DocsLayout.astro
│   ├── pages/
│   │   ├── docs/          # Documentation routes
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── privacy.astro
│   │   └── terms.astro
│   └── styles/
└── package.json
```

---

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.

## License

[MIT](./LICENSE) © Vince Roi S. Magwili
