"use client"
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { marked } from 'marked';
import React, { useCallback, useState } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '');
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  safetySettings
});
const generationConfig = {
  temperature: 1,
  topP: 1,
  topK: undefined,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};
const Chef: React.FC = () => {
  const [ingredients, setIngredients] = useState('');
  const [result, setResult] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [crop, setCrop] = useState<Crop>({ unit: 'px', width: 30, height: 30, x: 0, y: 0 });
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState('');
  const [imageSrc, setImageSrc] = useState<{ src: string; width: number; height: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const combinedIngredients = [ingredients, extractedText].filter(item => item).join(', ');
      if (combinedIngredients !== "") {
        const prompt = `Ingredients: ${combinedIngredients}

1. For the given ingredients in ${combinedIngredients}:
   - Provide a detailed recipe to cook a healthy food item using these ingredients.
   - Ensure the recipe is easy to follow with step-by-step instructions.
   - List all the nutrients present in the final dish.
   - Mention any health benefits of the dish.
   
2. If an ingredient in ${combinedIngredients} is not recognized:
   a) Convert the ingredient name completely to lowercase and check again
   b) If still unrecognized, use advanced string matching algorithms to identify the closest matching ingredient
   c) If a close match is found, provide the information as in step 1, but preface with:
      "The ingredient '[unrecognized ingredient]' is not recognized. Did you mean [closest match]? Here's the recipe using [closest match]:"
   d) If no close match is found, respond with:
      "The ingredient '[unrecognized ingredient]' is not recognized and no close matches were found. Please verify the spelling and try again."

3. Do not include any disclaimers or suggestions to consult a healthcare professional in the response.
4. Focus on healthy recipes and detailed nutrient information as the most prioritized information.`;

const parts = [{ text: prompt }];
const response = await model.generateContent({
  contents: [{ role: "user", parts }],
  generationConfig
});
const html = marked(response.response.text());
setResult(html);
}
} catch (error) {
console.error('Error:', error);
setResult('An error occurred while fetching the food information.');
}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setExtractedText('');
  
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = new Image();
          img.onload = () => {
            setImageSrc({
              src: img.src,
              width: img.width,
              height: img.height
            });
          };
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((crop: PixelCrop, percentCrop: Crop) => {
    if (imageSrc && percentCrop.width && percentCrop.height) {
      getCroppedImg(imageSrc.src, percentCrop, imageSrc.width, imageSrc.height)
        .then(blob => {
          if (blob) {
            setCroppedImageBlob(blob);
            const url = URL.createObjectURL(blob);
            setCroppedImageUrl(url);
          }
        })
        .catch(error => console.error('Error cropping image:', error));
    }
  }, [imageSrc]);

  const getCroppedImg = (imageSrc: string, crop: Crop, originalWidth: number, originalHeight: number): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleX = originalWidth / 100;
        const scaleY = originalHeight / 100;
  
        canvas.width = crop.width * scaleX;
        canvas.height = crop.height * scaleY;
        const ctx = canvas.getContext('2d');
  
        if (ctx) {
          ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY
          );
  
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          }, 'image/jpeg');
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      image.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const handleExtract = async () => {
    if (croppedImageBlob) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(croppedImageBlob);
        reader.onloadend = async () => {
          const base64data = reader.result;
          const response = await fetch('/api/obj-detect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64data }),
          });
          const data = await response.json();
          setExtractedText(data.ingredients);
        };
      } catch (error) {
        console.error('Error:', error);
        setExtractedText('Failed to extract ingredients from image');
      }
    }
  };

  const toBase64 = (file: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-8">AI Chef Assistant</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Enter Ingredients or Upload Image</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="Enter ingredients"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Upload Image
                </label>
                {imageSrc && (
                  <span className="text-sm text-gray-600">Image uploaded</span>
                )}
              </div>
              {imageSrc && (
                
                <div className="mt-4">
                  <ReactCrop
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    onComplete={onCropComplete}
                  >
                    <img src={imageSrc.src} alt="Source" style={{ maxWidth: '100%', height: 'auto' }} />
                  </ReactCrop>
                </div>
              )}
              {croppedImageBlob && (
                <button
                  type="button"
                  onClick={handleExtract}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Extract Ingredients
                </button>
              )}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Get Recipe
              </button>
            </form>
          </div>
          
          <div className="space-y-6">
            {extractedText && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Extracted Ingredients:</h3>
                <p className="text-gray-700">{extractedText}</p>
              </div>
            )}
            {croppedImageUrl && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cropped Image:</h3>
                <img src={croppedImageUrl} alt="Cropped" className="max-w-full h-auto" />
              </div>
            )}
          </div>
        </div>
        
        {result && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recipe:</h2>
            <div dangerouslySetInnerHTML={{ __html: result }} className="prose max-w-none" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chef;
