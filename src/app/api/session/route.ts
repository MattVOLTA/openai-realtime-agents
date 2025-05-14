import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Allow callers to specify ?model=... so the token matches their WS URL
    const { searchParams } = new URL(request.url);
    const model = searchParams.get("model") || "gpt-4o-realtime-preview";

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model }),
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

    // Minimal logging so we can debug TTL & mismatches without leaking the full token
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "Minted realtime token – exp:",
        data?.expires_at,
        "model:",
        model,
        "token prefix:",
        typeof data?.ephemeral_key === "string" ? data.ephemeral_key.slice(0, 6) : "n/a"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unhandled error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
