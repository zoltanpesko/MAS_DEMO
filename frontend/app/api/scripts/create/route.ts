import { NextRequest, NextResponse } from "next/server";

// Disable SSL verification for demo purposes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { autoscript, description, scriptlanguage, source, serverUrl, apiKey } = body;

    if (!serverUrl || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing server URL or API key" },
        { status: 400 }
      );
    }

    if (!autoscript) {
      return NextResponse.json(
        { success: false, error: "Script name is required" },
        { status: 400 }
      );
    }

    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT`;
    const url = `${maximoUrl}?apikey=${apiKey}&lean=1`;

    const scriptData = {
      autoscript: autoscript.toUpperCase(),
      description: description || "",
      scriptlanguage: scriptlanguage || "python",
      active: false,
      status: "DRAFT",
      source: source || "",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scriptData),
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
      message: "Script created successfully",
    });
  } catch (error: any) {
    console.error("Error creating script:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create script",
      },
      { status: 500 }
    );
  }
}
