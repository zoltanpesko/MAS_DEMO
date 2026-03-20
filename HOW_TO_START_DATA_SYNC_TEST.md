# How to Start Maximo Data Sync Test

This guide will help you set up and run the Maximo Data Sync Test application.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Access to a Maximo Application Suite (MAS) instance
- Valid Maximo API credentials

## Quick Start

### 1. Install Dependencies

```bash
cd "MAS Vendor page"
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mas_vendor_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Maximo Configuration
MAS_SERVER_URL=https://your-maximo-instance.com
MAS_API_KEY=your-api-key-here
```

### 3. Start the Application

```bash
npm start
```

The server will start on `http://localhost:3000`

### 4. Access the Data Sync Test Page

Open your browser and navigate to:

```
http://localhost:3000/maximo-data-sync-test.html
```

## Using the Data Sync Test Page

### Configure API Settings

1. **MAS Server URL**: Enter your Maximo Application Suite server URL
   - Example: `https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com`

2. **API Key**: Enter your Maximo API key
   - This is required for authentication with the Maximo REST API

3. Click **Save Configuration** to store your settings

### View System Information

1. The page will automatically load:
   - **Logged-in User Information**: Current user details from Maximo
   - **Maximo System Information**: System details including version, database, OS, etc.

2. Click the **🔄 Refresh** button to reload the system information

3. The **Last Refreshed** timestamp shows when the data was last updated

### System Information Displayed

- 📦 **Maximo Version**: Current Maximo Manage version
- 🔧 **Operator Version**: MAS Operator version
- 💾 **Database**: Database type and version
- 🖥️ **Operating System**: OS name and version
- 🌐 **App Server**: Application server information
- 📊 **Processors**: Number of available processors
- ✅ **Data Source**: Indicates if data is live from Maximo or mock data
- 🕒 **Last Refreshed**: Timestamp of last data refresh

## Troubleshooting

### Connection Issues

If you see "Failed to load system information":
- Verify your MAS Server URL is correct
- Check that your API Key is valid
- Ensure your Maximo instance is accessible from your network
- Check browser console for detailed error messages

### CORS Issues

If you encounter CORS errors:
- Ensure the backend server is running
- Check that the proxy configuration in the backend is correct
- Verify that your Maximo instance allows requests from your domain

### Authentication Errors

If you get authentication errors:
- Verify your API Key is correct and not expired
- Check that your user has appropriate permissions in Maximo
- Ensure the API Key format matches what Maximo expects

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

This will start the server with nodemon for automatic restarts on file changes.

## File Structure

```
MAS-Demo-Shareable/
├── frontend/
│   └── public/
│       └── maximo-data-sync-test.html  # Main test page
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── config/          # Configuration files
│   └── server.js            # Express server
├── .env                     # Environment variables (create this)
├── .env.example            # Example environment file
└── package.json            # Dependencies and scripts
```

## API Endpoints

The application provides the following endpoints:

- `GET /api/systeminfo` - Fetch Maximo system information
- `GET /api/whoami` - Get current logged-in user information

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review the server logs for backend errors
3. Verify your Maximo instance is accessible
4. Ensure all environment variables are correctly set

## Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secure and rotate them regularly
- Use HTTPS in production environments
- Implement proper authentication and authorization

## License

This is a demonstration application for testing Maximo data synchronization.