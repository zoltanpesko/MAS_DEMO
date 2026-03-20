import { NextRequest, NextResponse } from "next/server";

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { whereclause, serverUrl, apiKey } = body;
    const resolvedParams = await params;
    const relationshipName = resolvedParams.id;

    if (!serverUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing server URL or API key" },
        { status: 400 }
      );
    }

    const encodedId = Buffer.from(relationshipName).toString('base64');
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIDB/${encodedId}`;
    const url = `${maximoUrl}?apikey=${apiKey}`;

    const updateData = {
      whereclause: whereclause,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-method-override": "PATCH",
        "patchtype": "MERGE",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Maximo API error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Maximo API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
      message: "Relationship updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating relationship:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update relationship",
      },
      { status: 500 }
    );
  }
}
