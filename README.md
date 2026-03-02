# Install the required stuff

```bash
git clone https://github.com/your-username/margin.git
cd margin
```

Run the program

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **`http://localhost:3000`**

### 3. Backend Setup (Optional)

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your JWT secret
npm run dev
```

Backend runs at **`http://localhost:8080`**

### 4. Configure Environment (Optional)

For Supabase integration, create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🎨 Customization

### Theme System

Margin uses CSS variables for theming. Customize in `frontend/app/globals.css`:

```css
:root {
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;
  --bg-primary: #ffffff;
  --bg-hover: #f5f5f5;
  --border-default: #e0e0e0;
}
```

### Grid Layout

The dashboard uses an 8×8 grid system:

- **Widgets** can span multiple grid cells
- **Minimum size**: 1×1 grid cell
- **Drag & drop** to reposition
- **Resize handles** on bottom-right corner

### Local Storage

Layouts and content persist automatically:

- `margin-grid-layout`: Widget positions
- `margin-text-widgets`: Text content
- `margin-image-widgets`: Image data
- `margin-static-content`: Static text

---

## 🧩 Widgets

### Adding Widgets

Press **⌘K** (Mac) or **Ctrl+K** (Windows) to open the command menu:

- **Add Text Box** - Rich text editing area
- **Add Image** - File upload widget
- **Add Calendar** - Month view calendar
- **Add Daily Events** - Task and event list

### Widget Features

| Widget Type | Features |
|---|---|
| **Text** | Rich formatting, links, code blocks, lists |
| **Image** | Drag & drop upload, base64 storage, resize |
| **Calendar** | Month navigation, date selection |
| **Events** | Task management, daily agenda |

### Custom Widgets

To create custom widgets:

1. Create component in `frontend/components/`
2. Add to widget registry in `useGridLayout.ts`
3. Register in command menu

---

## 📱 Usage

### Basic Workflow

1. **Start with Home Page** - Default dashboard with welcome content
2. **Open Command Menu** - ⌘K to add widgets
3. **Customize Layout** - Drag widgets to reposition
4. **Resize Widgets** - Drag bottom-right corner
5. **Edit Content** - Click to edit text, upload images
6. **Navigate Pages** - Use sidebar or command menu

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open command menu |
| `Escape` | Close command menu |
| `Click` | Edit text content |
| `Drag` | Move widgets |
| `Drag corner` | Resize widgets |

### Creating Pages

- Navigate to `/page/your-page-name`
- Each page has independent layout and widgets
- Calendar page available at `/calander`

---

## 🛠️ Development

### Frontend Development

```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
```

### Backend Development

```bash
cd backend
npm run dev      # Development with hot reload
npm run build    # Build for production
npm run test     # Run tests
npm run test:cov # Coverage report
```

### Project Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite |

### File Structure Guide

- `frontend/app/` - Next.js pages and layouts
- `frontend/components/` - Reusable UI components
- `frontend/lib/hooks/` - Custom React hooks
- `backend/src/modules/` - NestJS modules
- `backend/src/common/` - Shared utilities

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes and add tests
4. **Ensure** all tests pass: `npm test`
5. **Commit** with conventional format: `feat: add amazing feature`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure TypeScript types are accurate
- Test on multiple screen sizes

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [Cameron Ginther](https://github.com/DiamondJdev), Chloe Hunter, and Brett Berry

*Create your perfect digital workspace with Margin*

</div>