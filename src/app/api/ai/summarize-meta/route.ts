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
    const { metadata, fileName, fileSize } = body;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.5,
      },
    });

    const prompt = `
Analyze this audio metadata and provide a highly concise summary.
DO NOT include any conversational filler or introductions (e.g., "Here is..."). Be direct and brief.

Metadata:
- File Name: ${fileName}
- File Size: ${fileSize}
- Title: ${metadata.title || "Unknown"}
- Artist: ${metadata.artist || "Unknown"}
- Album: ${metadata.album || "Unknown"}
- Year: ${metadata.year || "Unknown"}
- Genre: ${metadata.genre || "Unknown"}
- Has Cover Art: ${metadata.picture ? "Yes" : "No"}

Provide a 2-3 sentence analysis of the data and suggest missing tags if any. Output strictly text without chatbot introduction.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });
  } catch (error) {
    console.error("AI Insight error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI insight" },
      { status: 500 },
    );
  }
}
