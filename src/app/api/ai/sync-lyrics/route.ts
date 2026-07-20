import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const lyricsText = formData.get("lyrics") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    if (!lyricsText || !lyricsText.trim()) {
      return NextResponse.json(
        { error: "No lyrics text provided" },
        { status: 400 },
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    // Use gemini-3.1-flash-lite as configured in the other API routes
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.2, // Low temperature for precise timestamp generation
      },
    });

    const prompt = `
You are an expert audio lyrics aligner. Your task is to synchronize the provided lyrics text with the accompanying audio file.

Here is the lyrics text to align:
---
${lyricsText}
---

Generate the lyrics in standard LRC format. For every line of the lyrics, listen to the audio and find the exact time (minutes, seconds, and centiseconds) where that line begins, and prepend it with [mm:ss.xx] timestamp.
Do not change the lyrics wording, just add timestamps.
If a line is purely instrumental or has a long pause, do not invent text, just skip to the next active line.
DO NOT include any conversational introduction, markdown code block wraps (like \`\`\`lrc or \`\`\`), or concluding remarks.
Output ONLY the raw LRC text format starting with timestamps.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type || "audio/mp3",
          data: base64Audio,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean up any potential markdown wrap if the model ignored the instructions
    const cleanLrc = text
      .replace(/^```[a-zA-Z]*\n/gm, "")
      .replace(/```$/gm, "")
      .trim();

    return NextResponse.json({ lrc: cleanLrc });
  } catch (error) {
    console.error("AI Lyrics Sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to align lyrics using AI",
      },
      { status: 500 },
    );
  }
}
