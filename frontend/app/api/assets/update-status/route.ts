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

    // Update asset status in Maximo
    // According to Maximo REST API docs, the resource identifier should be base64 encoded
    // Format: assetnum/siteid encoded in base64
    const resourceId = Buffer.from(`${assetnum}/${siteid}`).toString('base64');
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIASSET/_${resourceId}?apikey=${apiKey}`;

    console.log('=== UPDATE REQUEST ===');
    console.log('Asset:', assetnum, 'Site:', siteid);
    console.log('New Status:', status);
    console.log('Resource ID (base64):', resourceId);
    console.log('Update URL:', maximoUrl.replace(apiKey, '***'));
    console.log('Payload:', JSON.stringify({ 'spi:status': status }));

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

    console.log('=== UPDATE RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Maximo API error:', response.status, responseText);
      console.log('Response body:', responseText.substring(0, 1000));
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update asset: ${response.status} ${response.statusText}`,
          details: responseText.substring(0, 1000)
        },
        { status: response.status }
      );
    }

    // HTTP 204 No Content means success with no response body
    if (response.status === 204) {
      console.log('✅ Successfully updated asset status (204 No Content)');
      console.log('=== END UPDATE ===\n');
      
      // Verify the update by fetching the asset
      try {
        const verifyUrl = `${serverUrl}/maximo/api/os/MXAPIASSET/_${resourceId}?apikey=${apiKey}&oslc.select=assetnum,status,siteid`;
        console.log('Verifying update...');
        const verifyResponse = await fetch(verifyUrl);
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('Verification response:', JSON.stringify(verifyData, null, 2));
        }
      } catch (verifyError) {
        console.log('Could not verify update:', verifyError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Asset status updated successfully',
        status: status,
        assetnum: assetnum,
        siteid: siteid,
      });
    }

    // For other success responses, try to parse JSON
    const responseText = await response.text();
    console.log('Response body:', responseText.substring(0, 500));
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
      console.log('✅ Successfully updated asset status');
      console.log('Response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // If we can't parse but got success status, still return success
      return NextResponse.json({
        success: true,
        message: 'Asset status updated successfully',
      });
    }

    console.log('=== END UPDATE ===\n');
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

// Made with Bob
