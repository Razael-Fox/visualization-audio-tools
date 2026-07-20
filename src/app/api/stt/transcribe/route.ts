import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key not configured" },
        { status: 500 },
      );
    }

    // Convert Web File to a Node.js compatible buffer/stream for Groq SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // We need to pass it in a format groq-sdk accepts
    const fileForGroq = new File([buffer], file.name, { type: file.type });

    const transcription = await groq.audio.transcriptions.create({
      file: fileForGroq,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json", // include timestamps if needed
    });

    return NextResponse.json({
      text: transcription.text,
      details: transcription,
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
