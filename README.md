# Proxy Tester

A cross-platform desktop application for testing HTTP/HTTPS proxies at scale. Built with Go, Wails, React, and TypeScript.

Proxy Tester allows you to paste or import lists of proxies, test them against custom URLs with configurable concurrency and timeouts, view real-time progress, and export results — all from a modern desktop UI.

## Features

- **Proxy Parsing** — Supports `ip:port` and `ip:port:user:password` formats with automatic validation
- **Batch Testing** — Test hundreds of proxies simultaneously with configurable thread count
- **Real-time Progress** — Live updates showing completed, alive, and dead counts as tests run
- **Latency Measurement** — Records response time in milliseconds for each proxy
- **Save & Load Lists** — Persist proxy lists locally for reuse across sessions
- **Export Results** — Export all proxies or filter by alive/dead status
- **Custom Test URLs** — Configure multiple test domains with sensible defaults (Google, Walmart)
- **Configurable Timeouts** — Set per-proxy timeout in seconds to avoid hanging
- **Cancel Support** — Stop a running test at any time
- **Frameless Dark UI** — Clean, modern interface built with React, Radix UI, and Tailwind CSS

## Screenshot

<!-- Add a screenshot here once available -->

## Prerequisites

- **Go 1.25+** — [Download](https://go.dev/dl/)
- **Node.js 18+** and **npm** — [Download](https://nodejs.org/)
- **Wails CLI** — Install via:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

## Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/proxy-tester.git
cd proxy-tester

# Download Go dependencies
go mod download

# Install frontend dependencies
cd frontend && npm install && cd ..
```

## Development

Run the application in development mode with hot reloading:

```bash
wails dev
```

This starts the Go backend and Vite frontend dev server simultaneously. Changes to either will trigger a live reload.

### Frontend-only dev server

If you want to iterate on the frontend without the Go backend:

```bash
cd frontend && npm run dev
```

## Building

### Development build

```bash
wails build
```

### Production build

```bash
wails build -production
```

This produces a native binary in the `build` directory for your current platform. Wails supports building for Windows, macOS, and Linux.

### Cross-compilation

Use Wails' built-in Docker support for cross-platform builds:

```bash
wails build -platform windows/amd64
wails build -platform darwin/amd64
wails build -platform linux/amd64
```

## Usage

1. **Navigate to Test** — Go to the Test page and paste your proxy list (one per line)
2. **Select a Test URL** — Choose from your configured domains or add new ones in Settings
3. **Configure** — Set timeout (seconds) and thread count
4. **Start** — Click Start and watch real-time progress
5. **Export** — Copy alive or dead proxies to clipboard, or save the full list for later

### Proxy Format

Each line should be one of:

```
ip:port
ip:port:user:password
```

Lines starting with `#` are treated as comments and ignored.

### Data Storage

Proxy lists and settings are stored in `~/.proxy-tester/`:

```
~/.proxy-tester/
├── settings.json
└── lists/
    ├── mylist.json
    └── backlog.json
```

## Project Structure

```
proxy-tester/
├── main.go                 # Wails entry point
├── wails.json              # Wails configuration
├── go.mod / go.sum         # Go dependencies
├── app/
│   ├── app.go              # Main App struct, proxy parsing, test orchestration
│   ├── models.go           # Data models (Proxy, ProxyList, Settings, etc.)
│   ├── store.go            # JSON file persistence layer
│   └── tester.go           # HTTP proxy testing logic with concurrency
└── frontend/
    ├── package.json        # Frontend dependencies
    ├── vite.config.ts      # Vite configuration
    ├── tailwind.config.js  # Tailwind CSS configuration
    └── src/
        ├── App.tsx         # Router and layout
        ├── pages/          # Dashboard, Test, Lists, Settings pages
        ├── components/     # Reusable UI components
        ├── services/       # Wails backend bindings
        └── utils/          # Helper functions
```

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Backend     | Go 1.25, Wails v2                               |
| Frontend    | React 18, TypeScript, Vite 5                    |
| Styling     | Tailwind CSS 3, Radix UI, Lucide Icons          |
| Routing     | React Router DOM 6                              |
| Persistence | JSON files (`~/.proxy-tester/`)                 |

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/my-improvement
   ```
3. **Make your changes** following the existing code style
4. **Test locally** with `wails dev` to ensure everything works
5. **Commit** with clear, descriptive messages
6. **Push** and open a Pull Request

### Guidelines

- Follow the existing Go and TypeScript conventions in the codebase
- Add comments only for complex logic; keep code self-documenting
- Test changes in both dev and production builds where applicable
- Update this README if you add new features or change usage

## Issue Reporting

Found a bug or have a feature request? Please [open an issue](https://github.com/<your-username>/proxy-tester/issues) with:

- **Title** — Clear and descriptive
- **Description** — What happened, what did you expect
- **Steps to Reproduce** — Numbered list of actions
- **Environment** — OS, Go version, Node version
- **Logs** — Relevant console output or error messages (if applicable)

## Roadmap

- [ ] Proxy protocol selection (HTTP/HTTPS/SOCKS5)
- [ ] Geo-location and ISP info for each proxy
- [ ] Scheduled/recurring tests
- [ ] CSV/Excel export
- [ ] Proxy anonymity level detection (transparent, anonymous, elite)
- [ ] Dark/light theme toggle

## License

This project is unlicensed. Feel free to use, modify, and distribute as needed. A license file may be added in the future.

## Acknowledgments

- [Wails](https://wails.io/) — For making Go + web frontend desktop apps possible
- [Radix UI](https://www.radix-ui.com/) — For accessible, unstyled components
- [Tailwind CSS](https://tailwindcss.com/) — For utility-first styling
- [Lucide](https://lucide.dev/) — For beautiful icons
