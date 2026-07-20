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

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.5,
      },
    });

    const prompt = `
Analyze this audio file and provide a highly concise summary.
DO NOT include any conversational filler or chatbot introductions (e.g. "Certainly!", "Here is...").
Output strictly in the following format using bullet points:

**General:** [Genre/Mood/Feel]
**Structure:** [Timestamps and sections]
**Quality:** [Clarity and technical issues]
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

    return NextResponse.json({ insight: text });
  } catch (error: any) {
    console.error("AI Insight error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI insight for audio" },
      { status: 500 },
    );
  }
}
