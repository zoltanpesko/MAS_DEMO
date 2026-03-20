import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for demo purposes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = request.headers.get('x-mas-api-key');
    const serverUrl = request.headers.get('x-mas-server-url');

    if (!apiKey || !serverUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing API credentials' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const scriptId = resolvedParams.id;
    
    // Maximo REST API endpoint for a specific script
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT/${scriptId}?apikey=${apiKey}`;

    console.log('Fetching script details:', scriptId);

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
    console.log('Successfully fetched script details');

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error('Error fetching script:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { source, serverUrl, apiKey } = body;

    if (!source || !serverUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const scriptId = resolvedParams.id;
    
    console.log('=== UPDATE SCRIPT REQUEST ===');
    console.log('Script ID:', scriptId);
    console.log('New source length:', source.length, 'characters');

    // Maximo REST API endpoint
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT/${scriptId}?apikey=${apiKey}`;

    const response = await fetch(maximoUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-method-override': 'PATCH',
        'patchtype': 'MERGE',
        'Properties': 'spi:source',
      },
      body: JSON.stringify({
        'spi:source': source
      }),
    });

    console.log('Update response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Maximo API error:', response.status, responseText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to update script: ${response.status}`,
          details: responseText.substring(0, 1000)
        },
        { status: response.status }
      );
    }

    // Handle 204 No Content
    if (response.status === 204) {
      console.log('✅ Successfully updated script (204 No Content)');
      return NextResponse.json({
        success: true,
        message: 'Script updated successfully',
      });
    }

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
      console.log('✅ Successfully updated script');
    } catch (parseError) {
      return NextResponse.json({
        success: true,
        message: 'Script updated successfully',
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error('Error updating script:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Made with Bob