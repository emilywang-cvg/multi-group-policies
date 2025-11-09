# Multi Group Policies

A Vue 3 + TypeScript + TailwindCSS application for managing multi-company document uploads with three UX approaches.

## Features

- **Tree View Demo**: Hierarchical company tree with document management
- **Grid View Demo**: Spreadsheet-like table view for bulk document operations
- **Doc Type View Demo**: Document-type centric view with drawer navigation

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- TailwindCSS v3
- Vue Router
- Pinia
- Vite

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## GitHub Pages Deployment

This repository is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages in repository settings:**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - Save the settings

2. **Update your Personal Access Token** (if needed):
   - Go to https://github.com/settings/tokens
   - Create a new token or edit existing one
   - Ensure it has both `repo` and `workflow` scopes
   - Use this token for pushing workflow files

3. **Deployment happens automatically:**
   - Every push to `main` branch triggers a build
   - The site will be available at: `https://emilywang-cvg.github.io/multi-group-policies/`

### Manual Deployment

If you prefer to deploy manually:

```bash
npm run build
# Then push the dist folder to gh-pages branch
```

## Project Structure

```
src/
├── features/
│   └── document-upload/    # Document upload demos
│       ├── TreeViewDemo.vue
│       ├── GridViewDemo.vue
│       └── DocTypeViewDemo.vue
├── pages/                   # Application pages
├── app/                     # Router and store
└── styles/                  # Global styles
```

## License

Private project
