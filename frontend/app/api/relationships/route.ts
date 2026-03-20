import { NextRequest, NextResponse } from "next/server";

// Disable SSL verification for demo purposes (self-signed certificates)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(request: NextRequest) {
  try {
    const serverUrl = request.headers.get("x-mas-server-url");
    const apiKey = request.headers.get("x-mas-api-key");
    const pageSize = request.nextUrl.searchParams.get("pageSize") || "50";
    const parent = request.nextUrl.searchParams.get("parent");

    if (!serverUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing server URL or API key" },
        { status: 400 }
      );
    }

    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIDB`;
    
    // Build URL with optional parent filter
    let url = `${maximoUrl}?apikey=${apiKey}&lean=1&oslc.select=name,parent,child,whereclause,cardinality,remarks,maxrelationshipid&oslc.pageSize=${pageSize}`;
    
    if (parent) {
      // Add WHERE clause to filter by parent
      url += `&oslc.where=parent="${parent}"`;
    }

    console.log("Fetching relationships from Maximo:", maximoUrl);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Response status:", response.status);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    console.log("Response headers:", responseHeaders);

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
    console.log("Response body (first 500 chars):", JSON.stringify(data).substring(0, 500));
    console.log("Successfully fetched relationships from Maximo");

    return NextResponse.json({
      success: true,
      data: data,
      source: "maximo",
    });
  } catch (error: any) {
    console.error("Error fetching relationships:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch relationships",
      },
      { status: 500 }
    );
  }
}

// Made with Bob
