import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for demo purposes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-mas-api-key');
    const serverUrl = request.headers.get('x-mas-server-url');

    if (!apiKey || !serverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing API credentials' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pageSize = searchParams.get('pageSize') || '50';

    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT?apikey=${apiKey}&lean=1&oslc.select=autoscript,description,scriptlanguage,active,status,source&oslc.pageSize=${pageSize}`;

    const response = await fetch(maximoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Maximo API error:', response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Maximo API error: ${response.status}`,
          details: errorText.substring(0, 1000)
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      source: 'maximo',
    });
  } catch (error: any) {
    console.error('Error fetching automation scripts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}