import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-mas-api-key');
    const serverUrl = request.headers.get('x-mas-server-url');

    if (!apiKey || !serverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing API key or server URL. Please configure your Maximo credentials.' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const pageSize = url.searchParams.get('pageSize') || '10';
    
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIASSET?apikey=${apiKey}&lean=1&oslc.select=assetnum,description,status,siteid,location,assettype,manufacturer,serialnum,installdate&oslc.pageSize=${pageSize}`;

    const response = await fetch(maximoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Maximo API error:', response.status, responseText);
      return NextResponse.json(
        {
          success: false,
          error: `Maximo API error: ${response.status} ${response.statusText}`,
          details: responseText.substring(0, 1000)
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON response from Maximo',
          details: responseText.substring(0, 1000)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      source: 'maximo',
      data: data,
    });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Maximo server',
        details: error.message
      },
      { status: 500 }
    );
  }
}
