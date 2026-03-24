import { NextRequest, NextResponse } from 'next/server';

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetnum, siteid, status, serverUrl, apiKey } = body;

    if (!assetnum || !siteid || !status || !serverUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const resourceId = Buffer.from(`${assetnum}/${siteid}`).toString('base64');
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIASSET/_${resourceId}?apikey=${apiKey}`;

    const response = await fetch(maximoUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-method-override': 'PATCH',
        'patchtype': 'MERGE',
        'Properties': 'spi:status',
      },
      body: JSON.stringify({
        'spi:status': status
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Maximo API error:', response.status, responseText);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update asset: ${response.status} ${response.statusText}`,
          details: responseText.substring(0, 1000)
        },
        { status: response.status }
      );
    }

    if (response.status === 204) {
      return NextResponse.json({
        success: true,
        message: 'Asset status updated successfully',
        status: status,
        assetnum: assetnum,
        siteid: siteid,
      });
    }

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return NextResponse.json({
        success: true,
        message: 'Asset status updated successfully',
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update asset',
        details: error.message
      },
      { status: 500 }
    );
  }
}
