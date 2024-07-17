import vision from '@google-cloud/vision';
import { readFile, unlink, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { join } from 'path';

// Read the JSON file
const readCredentials = async () => {
  const credentialsPath = join(process.cwd(), 'circular-fusion-429706-p8-e7b712d48884.json');
  const fileContents = await readFile(credentialsPath, 'utf8');
  return JSON.parse(fileContents);
};

export async function POST(request: NextRequest) {
  const credentials = await readCredentials();
  const client = new vision.ImageAnnotatorClient({ credentials });

  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save the file temporarily
  const tempDir = os.tmpdir();
  const filePath = join(tempDir, file.name);
  await writeFile(filePath, buffer);

  try {
    const [result] = await client.textDetection(filePath);
    const detections = result.textAnnotations;
    const extractedText = detections[0] ? detections[0].description : '';

    // Clean up the temporary file
    await unlink(filePath);

    return NextResponse.json({ success: true, text: extractedText });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to extract text' }, { status: 500 });
  }
}