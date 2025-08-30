import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Allow callers to specify ?model=... so the token matches their WS URL
    const { searchParams } = new URL(request.url);
    const model = searchParams.get("model") || "gpt-realtime";

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      body: JSON.stringify({ 
        model,
        voice: "cedar",
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200
        }
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Failed to mint realtime token:", response.status, text);
      return NextResponse.json(
        { error: "Failed to mint realtime token" },
        { status: 502 }
    );
    }

    const data = await response.json();

    // Always log a short prefix for debugging (safe).
    console.log(
      "[session] Minted token exp:",
      data?.expires_at,
      "model:",
      model,
      "prefix:",
      typeof data?.client_secret === "string"
        ? data.client_secret.slice(0, 6)
        : data.client_secret?.value?.slice(0, 6) ||
          (typeof data?.ephemeral_key === "string" ? data.ephemeral_key.slice(0, 6) : "n/a")
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unhandled error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
