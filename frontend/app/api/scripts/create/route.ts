import { NextRequest, NextResponse } from "next/server";

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

    // Construct the Maximo API URL for creating a new script
    const maximoUrl = `${serverUrl}/maximo/api/os/MXAPIAUTOSCRIPT`;
    const url = `${maximoUrl}?apikey=${apiKey}&lean=1`;

    console.log("Creating new script in Maximo:", autoscript);

    // Prepare the script data
    const scriptData = {
      autoscript: autoscript.toUpperCase(),
      description: description || "",
      scriptlanguage: scriptlanguage || "python",
      active: false,
      status: "DRAFT",
      source: source || "",
    };

    // Make POST request to Maximo to create the script
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scriptData),
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
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log("Script created successfully:", result);

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

// Made with Bob
