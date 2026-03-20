# Maximo Asset Viewer

A standalone web application for viewing assets from Maximo Application Suite (MAS) using the MXAPIASSET REST API.

## Features

- 🔧 Simple API configuration (Server URL + API Key)
- 📦 Load and display first 10 assets from Maximo
- 🕒 Last refreshed timestamp
- 📊 Clean table view with key asset information
- 🔄 Refresh button to reload data
- 📋 View full JSON response

## Quick Start

### Option 1: Direct File Access (No Server Required)

Simply open the HTML file in your browser:

```bash
open asset-viewer.html
# or
open frontend/public/asset-viewer.html
```

### Option 2: With Local Server

If you're running the backend server:

```bash
npm start
```

Then navigate to:
- `http://localhost:3000/asset-viewer.html`
- or `http://localhost:3000/frontend/public/asset-viewer.html`

## Configuration

1. **MAS Server URL**: Enter your Maximo Application Suite server URL
   - Example: `https://demo.manage.instance.apps.sc-ncee-demo.pok-lb.techzone.ibm.com`

2. **API Key**: Enter your Maximo API key for authentication

3. Click **Save Configuration** to store settings in browser localStorage

## Usage

1. Configure your API settings (see above)
2. Click **🔄 Load Assets** button
3. View the first 10 assets in a table format
4. Check the "Last Refreshed" timestamp to see when data was loaded
5. Expand "View Full JSON Response" to see the complete API response

## Asset Information Displayed

The viewer shows the following information for each asset:

- **Asset Number**: Unique identifier for the asset
- **Description**: Asset description
- **Status**: Current status (e.g., OPERATING, INACTIVE)
- **Site**: Site ID where the asset is located
- **Location**: Specific location within the site
- **Type**: Asset type classification
- **Manufacturer**: Asset manufacturer
- **Serial Number**: Manufacturer's serial number
- **Install Date**: Date when the asset was installed

## API Details

### Endpoint Used

```
GET /maximo/oslc/os/mxapiasset
```

### Query Parameters

- `oslc.select`: Specifies which fields to return
- `oslc.pageSize`: Limits results to 10 assets

### Selected Fields

```
assetnum, description, status, siteid, location, 
assettype, manufacturer, serialnum, installdate
```

## MXAPIASSET Object Structure

The MXAPIASSET API returns comprehensive asset information including:

- Basic asset details (number, description, status)
- Location information (site, location, hierarchy)
- Technical specifications (type, manufacturer, model)
- Lifecycle data (install date, warranty, expected life)
- Maintenance information (meters, specifications, downtime)
- Financial data (costs, GL accounts)
- Related records (documents, service addresses, plans)

## Troubleshooting

### CORS Issues

If you encounter CORS errors when accessing Maximo directly from the browser:

1. **Use a backend proxy** (recommended for production)
2. **Configure CORS on Maximo server** (if you have admin access)
3. **Use a browser extension** to disable CORS (development only)

### Authentication Errors

- Verify your API Key is correct and not expired
- Check that your user has permissions to access the MXAPIASSET object
- Ensure the API Key format matches Maximo's requirements

### No Assets Returned

- Verify the Maximo server URL is correct
- Check that assets exist in your Maximo instance
- Review the full JSON response for error messages
- Check browser console for detailed error information

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (not supported)

## Security Notes

- API keys are stored in browser localStorage
- Never commit API keys to version control
- Use HTTPS in production environments
- Implement proper authentication for production use
- Consider using a backend proxy to hide API keys from client

## Customization

### Modify Fields Displayed

Edit the `oslc.select` parameter in the `loadAssets()` function:

```javascript
const url = `${config.serverUrl}/maximo/oslc/os/mxapiasset?oslc.select=assetnum,description,status&oslc.pageSize=10`;
```

### Change Number of Assets

Modify the `oslc.pageSize` parameter:

```javascript
oslc.pageSize=20  // Show 20 assets instead of 10
```

### Add Filters

Add `oslc.where` parameter to filter results:

```javascript
&oslc.where=status="OPERATING"
```

## Related Files

- `asset-viewer.html` - Main HTML file (root directory)
- `frontend/public/asset-viewer.html` - Same file in public directory
- `HOW_TO_START_DATA_SYNC_TEST.md` - General setup guide

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify API configuration is correct
3. Test API endpoint directly using tools like Postman
4. Review Maximo REST API documentation

## License

This is a demonstration application for viewing Maximo assets.