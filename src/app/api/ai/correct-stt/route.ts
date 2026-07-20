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

    const body = await req.json();
    const { transcription } = body;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.5,
      },
    });

    const prompt = `
Correct this transcription. DO NOT include any conversational filler or introductions (e.g. "Here is the corrected text").
Fix errors, add punctuation and casing. 
Add a "--- Summary & Keywords ---" section with a 1-sentence summary and 3-5 keywords at the bottom.

Transcription:
"${transcription}"

Provide ONLY the corrected text and the summary section, nothing else.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error("AI Insight error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate AI insight" },
      { status: 500 },
    );
  }
}
