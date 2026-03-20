import { NextRequest, NextResponse } from "next/server";

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: NextRequest) {
  try {
    const serverUrl = request.headers.get("x-mas-server-url");
    const apiKey = request.headers.get("x-mas-api-key");

    if (!serverUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing server URL or API key" },
        { status: 400 }
      );
    }

    const maximoUrl = `${serverUrl}/maximo/api/whoami`;
    const url = `${maximoUrl}?apikey=${apiKey}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Maximo API error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Maximo API error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: any) {
    console.error("Error fetching whoami:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch whoami",
      },
      { status: 500 }
    );
  }
}
