import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { metadata, fileName, fileSize } = body;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        maxOutputTokens: 300,
      }
    });

    const prompt = `
You are an audio expert AI. Please analyze the following audio metadata and provide a short, engaging narrative summary (1-2 paragraphs).
Highlight any missing tags (like album art, genre, year) and suggest improvements. 
Also, estimate the audio quality if you can based on file size or available data.

Metadata:
- File Name: ${fileName}
- File Size: ${fileSize}
- Title: ${metadata.title || 'Unknown'}
- Artist: ${metadata.artist || 'Unknown'}
- Album: ${metadata.album || 'Unknown'}
- Year: ${metadata.year || 'Unknown'}
- Genre: ${metadata.genre || 'Unknown'}
- Has Cover Art: ${metadata.picture ? 'Yes' : 'No'}

Keep your tone helpful, professional, but slightly casual. Provide actionable insights.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ insight: text });
  } catch (error: any) {
    console.error("AI Insight error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI insight" },
      { status: 500 }
    );
  }
}
