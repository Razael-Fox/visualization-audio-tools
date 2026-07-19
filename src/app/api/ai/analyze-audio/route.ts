import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Audio = buffer.toString("base64");

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        maxOutputTokens: 400,
      }
    });

    const prompt = `
You are an expert audio engineer and music analyst. I am providing you with an audio file.
Please listen to it and provide a "Smart Waveform Insight" with the following:
1. General Characteristics: Describe the mood, genre (if applicable), and overall feel.
2. Structure: Break down the likely structure (e.g., Intro, Build-up, Chorus, Outro) with approximate timestamps if you can guess them.
3. Audio Quality: Note any obvious issues like clipping, background noise, or distortion. Suggest improvements.

Format the output clearly using bullet points and short paragraphs.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type || "audio/mp3",
          data: base64Audio
        }
      }
    ]);
    
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });
  } catch (error: any) {
    console.error("AI Insight error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI insight for audio" },
      { status: 500 }
    );
  }
}
