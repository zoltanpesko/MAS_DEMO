# MAS Vendor Page

A modern Next.js application for managing Maximo Application Suite (MAS) resources with a beautiful UI built with Tailwind CSS and Framer Motion.

## 🚀 Features

### Asset Management
- View and manage assets with inline editing
- Edit 7 key fields directly in the table
- Download assets as CSV
- Update asset status
- Real-time data synchronization

### Automation Scripts Management
- View all automation scripts
- Create new scripts with multiple language support
- Edit scripts with syntax highlighting (Python, JavaScript, Jython, Nashorn, etc.)
- Download scripts
- Adjustable font size for better readability
- Full-screen editor mode

### Database Relationships
- Browse and manage database relationships
- Search and filter by parent object
- Edit WHERE clauses with SQL syntax highlighting
- DB2 query optimization analyzer with 10 optimization rules
- Batch analysis to find optimization opportunities
- Top 10 issues display

### UI/UX
- Modern glassmorphism design
- Animated hero section with geometric shapes
- Responsive layout
- Dark theme optimized
- Smooth animations with Framer Motion

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.0 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Code Editor**: CodeMirror 6
- **Icons**: Lucide React
- **Deployment**: OpenShift / Docker

## 📋 Prerequisites

- Access to a Maximo Application Suite instance
- OpenShift CLI (oc) installed
- Access to an OpenShift cluster

## ⚡ Quick Start - Deploy to OpenShift

### Step 1: Download the Project

**Option A - Clone with Git:**
```bash
git clone https://github.com/zoltanpesko/MAS_DEMO.git
cd MAS_DEMO
```

**Option B - Download ZIP:**
1. Go to https://github.com/zoltanpesko/MAS_DEMO
2. Click the green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file
5. Open terminal in the extracted folder

### Step 2: Login to OpenShift

```bash
oc login --token=<your-token> --server=<your-server>
```

### Step 3: Deploy

```bash
cd openshift
./deploy-mas-demo.sh
```

The script will:
- ✅ Build the application from GitHub
- ✅ Deploy to mas-demo project
- ✅ Create HTTPS route
- ✅ Display the application URL

### Step 4: Access Your Application

After deployment completes, visit the URL shown by the script, or get it with:

```bash
oc get route mas-vendor-page -n mas-demo
```

Then configure your MAS connection in the UI.

## 🌐 Configuration

On first launch, configure your MAS connection:

1. Navigate to the home page
2. Enter your MAS server URL
3. Enter your username and password
4. Click "Save Configuration"

The configuration is stored in your browser's localStorage.

## 💻 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/zoltanpesko/MAS_DEMO.git
cd MAS_DEMO
```

### 2. Install dependencies

```bash
cd frontend
npm install
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
MAS_DEMO/
├── frontend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── assets/       # Asset management endpoints
│   │   │   ├── scripts/      # Script management endpoints
│   │   │   ├── relationships/# Relationship management endpoints
│   │   │   ├── whoami/       # User info endpoint
│   │   │   ├── systeminfo/   # System info endpoint
│   │   │   └── health/       # Health check endpoint
│   │   ├── assets/           # Assets page
│   │   ├── scripts/          # Scripts page
│   │   ├── relationships/    # Relationships page
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # UI components
│   │   └── demo.tsx          # Demo components
│   ├── lib/
│   │   └── utils.ts          # Utility functions
│   ├── public/               # Static files
│   ├── Dockerfile            # Docker configuration
│   ├── package.json          # Dependencies
│   └── next.config.js        # Next.js configuration
├── openshift/                # OpenShift deployment files
│   ├── deployment.yaml       # Deployment configuration
│   ├── service.yaml          # Service configuration
│   ├── route.yaml            # Route configuration
│   ├── imagestream.yaml      # ImageStream configuration
│   ├── buildconfig.yaml      # BuildConfig configuration
│   ├── build-and-deploy.sh   # Deployment script
│   ├── QUICKSTART.md         # Quick deployment guide
│   ├── TROUBLESHOOTING.md    # Troubleshooting guide
│   └── README.md             # OpenShift documentation
└── README.md                 # This file
```

## 🚀 Deployment

### Deploy to OpenShift

The application is configured to deploy to OpenShift using binary builds (no Git required).

#### Quick Deployment

```bash
# Login to OpenShift
oc login --token=<your-token> --server=<your-server>

# Deploy
cd openshift
./build-and-deploy.sh
```

#### Manual Deployment

```bash
# 1. Start build from local source
oc start-build mas-vendor-page --from-dir=../frontend --follow -n mas-demo

# 2. Deploy
oc apply -f deployment.yaml -n mas-demo
oc apply -f service.yaml -n mas-demo
oc apply -f route.yaml -n mas-demo

# 3. Get application URL
oc get route mas-vendor-page -n mas-demo
```

For detailed deployment instructions, see [openshift/QUICKSTART.md](openshift/QUICKSTART.md).

### Docker Deployment

```bash
# Build image
cd frontend
docker build -t mas-vendor-page:latest .

# Run container
docker run -p 3000:3000 mas-vendor-page:latest
```

## 📖 Usage

### Asset Management

1. Navigate to **Assets** page
2. View all assets in a table format
3. Click any cell to edit inline
4. Click **Save** to persist changes
5. Use **Download CSV** to export data
6. Use **Update Status** to change asset status

### Script Management

1. Navigate to **Scripts** page
2. View all automation scripts
3. Click **Create New Script** to add a script
4. Click **Edit** to modify existing scripts
5. Use the code editor with syntax highlighting
6. Adjust font size with +/- buttons
7. Click **Save** to persist changes
8. Click **Download** to export scripts

### Relationship Management

1. Navigate to **Relationships** page
2. Search for a parent object (e.g., "WORKORDER")
3. View all relationships for that object
4. Click **Find Issues** to analyze all relationships
5. View top 10 optimization opportunities
6. Click any relationship to edit WHERE clause
7. Use SQL syntax highlighting in the editor
8. Click **Save** to persist changes

## 🔍 DB2 Optimization Rules

The relationship analyzer checks for:

1. Leading wildcard in LIKE clauses
2. OR to IN conversion opportunities
3. Functions on indexed columns
4. NOT IN inefficiency
5. Implicit type conversions
6. Arithmetic operations in WHERE
7. LIKE to = optimization
8. Redundant conditions
9. COUNT to EXISTS optimization
10. Overall query optimization suggestions

## 🛡️ Security

- All API credentials are stored in browser localStorage
- HTTPS is enforced in production
- Self-signed certificates are supported for development
- No credentials are stored in the codebase

## 🧪 Development

### Run tests

```bash
npm run test
```

### Build for production

```bash
npm run build
npm start
```

### Lint code

```bash
npm run lint
```

## 📝 Environment Variables

The application uses localStorage for configuration. No environment variables are required for basic operation.

For production deployment, you can optionally set:

- `NODE_ENV=production` - Enable production mode
- `PORT=3000` - Server port (default: 3000)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Zoltan Pesko**

- GitHub: [@zoltanpesko](https://github.com/zoltanpesko)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Animated with [Framer Motion](https://www.framer.com/motion/)
- Code editing with [CodeMirror](https://codemirror.net/)
- Icons from [Lucide](https://lucide.dev/)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [troubleshooting guide](openshift/TROUBLESHOOTING.md)
- Review the [deployment documentation](openshift/README.md)

---

Made with ❤️ for Maximo Application Suite