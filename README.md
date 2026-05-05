# MAS Vendor Page

A modern Next.js application for managing Maximo Application Suite (MAS) resources with a beautiful UI.

## 🚀 Features

- **Asset Management** - View, edit, and download assets with inline editing
- **Work Orders** - Create, view, edit, and manage work orders with status tracking and MXAPIWO integration
- **Automation Scripts** - Create and edit scripts with syntax highlighting (Python, JavaScript, etc.) and AI-powered optimization
- **Database Relationships** - Manage relationships with SQL editor and DB2 optimization analyzer
- **Modern UI** - Glassmorphism design with smooth animations and responsive layout

## 📋 Prerequisites

- Access to a Maximo Application Suite instance
- OpenShift CLI (oc) installed
- Access to an OpenShift cluster

## ⚡ Quick Start

### 1. Download the Project

**Clone with Git:**
```bash
git clone https://github.com/zoltanpesko/MAS_DEMO.git
cd MAS_DEMO
```

**Or Download ZIP:**
- Go to https://github.com/zoltanpesko/MAS_DEMO
- Click "Code" → "Download ZIP"
- Extract and open terminal in the folder

### 2. Login to OpenShift

```bash
oc login --token=<your-token> --server=<your-server>
```

### 3. Deploy

```bash
cd openshift
./deploy-mas-demo.sh
```

### 4. Access Your Application

```bash
oc get route mas-vendor-page -n mas-demo
```

Visit the URL and configure your MAS connection in the UI.

## 🌐 Configuration

On first launch:
1. Enter your MAS server URL
2. Enter your username and password
3. Click "Save Configuration"

Configuration is stored in browser localStorage.

## 💻 Local Development

```bash
git clone https://github.com/zoltanpesko/MAS_DEMO.git
cd MAS_DEMO/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- Next.js 16.2.0 + TypeScript
- React Query (TanStack Query) for data fetching
- Tailwind CSS v4
- Framer Motion
- CodeMirror 6
- Lucide React Icons
- OpenShift / Docker

## 📖 Usage

### Assets
- View and edit assets inline
- Download as CSV
- Update status
- Real-time data synchronization

### Work Orders
- Create new work orders with detailed information
- View and manage existing work orders
- Edit work order details inline
- Update work order status (WAPPR, INPRG, COMP, CLOSE, CAN)
- Filter and search work orders
- MXAPIWO API integration for seamless data management

### Scripts
- Create/edit automation scripts
- Syntax highlighting for 11+ languages
- Adjustable font size
- AI-powered optimization suggestions
- Script validation and error checking

### Relationships
- Browse database relationships
- Edit WHERE clauses with SQL highlighting
- DB2 optimization analyzer with 10 rules
- Real-time query optimization

## 🔍 DB2 Optimization

The analyzer checks for:
1. Leading wildcard in LIKE
2. OR to IN conversion
3. Functions on indexed columns
4. NOT IN inefficiency
5. Implicit type conversions
6. Arithmetic in WHERE
7. LIKE to = optimization
8. Redundant conditions
9. COUNT to EXISTS
10. Query optimization suggestions

## 📦 Deployment Options

### OpenShift (Recommended)
```bash
cd openshift
./deploy-mas-demo.sh
```

### Docker
```bash
cd frontend
docker build -t mas-vendor-page .
docker run -p 3000:3000 mas-vendor-page
```

For detailed instructions, see [openshift/QUICKSTART.md](openshift/QUICKSTART.md)

---

Made with ❤️ for Maximo Application Suite