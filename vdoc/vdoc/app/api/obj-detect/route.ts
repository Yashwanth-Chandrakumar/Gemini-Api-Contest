import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
if (!API_KEY) {
  throw new Error('GOOGLE_API_KEY is not set in the environment variables');
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    const base64Image = image.split(',')[1]; // Remove the data URL prefix

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg'
        }
      },
      "Give names of all ingredients present in the image separated by commas. Give only the ingredients names dont give any intro texts like [The ingredients in the image are..] etc.. I need just the ingredients names alone separated by commas."
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ ingredients: text });
  } catch (error) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}