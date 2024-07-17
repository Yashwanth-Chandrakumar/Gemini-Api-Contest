"use client"
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { marked } from 'marked';
import React, { useCallback, useState } from 'react';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
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

const Home: React.FC = () => {
  const [drugName, setDrugName] = useState('');
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
      let extractedDrugName = drugName || extractedText;
      if (extractedDrugName !== "") {
        const parts = [
          { text: "Drug name: give the complete drug interaction and primary use of Warfarin" },
          {
            text: "Drug interaction: **Drug Name:** Warfarin\n\n**Primary Use:** Anticoagulant (prevents blood clots)\n\n**Drug Interactions:**\n\n* **Antibiotics:**\n    * **Rifampin:** Decreases warfarin effectiveness\n    * **Ciprofloxacin:** Increases warfarin effectiveness\n* **NSAIDs (Pain Relievers):**\n    * **Aspirin, Ibuprofen:** Increase warfarin effectiveness\n* **Other Anticoagulants:**\n    * **Heparin:** Additive anticoagulant effect\n* **Antidepressants:**\n    * **Fluoxetine:** Increases warfarin effectiveness\n* **Anticonvulsants:**\n    * **Carbamazepine:** Decreases warfarin effectiveness\n* **Antivirals:**\n    * **Ritonavir:** Increases warfarin effectiveness\n* **Herbal Supplements:**\n    * **Ginkgo biloba:** Increases bleeding risk\n    * **Garlic:** May increase anticoagulant effect\n* **Foods:**\n    * **Leafy green vegetables (e.g., spinach, kale):** High in vitamin K, which can reduce warfarin effectiveness"
          },
          {
            text: `Drug name: ${extractedDrugName} If the input is a valid drug name, provide the complete drug interaction and primary use information. If the input is not a recognized drug name, it might be a typos give information of the closest drug related to the name else respond accordingly. Don't ask the user to talk with a doctor they know it they are just referring so don't add a note to consult a doctor as they are going to do it anyway.`
          },
          { text: "Drug interaction: " },
        ];
        const response = await model.generateContent({
          contents: [{ role: "user", parts }],
          generationConfig
        });
        const html = marked(response.response.text());
        setResult(html);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while fetching the drug interaction information.');
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
      const formData = new FormData();
      formData.append('file', croppedImageBlob, 'cropped-image.jpg');
  
      try {
        const response = await fetch('/api/extract-text', {
          method: 'POST',
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error('Failed to extract text from image');
        }
  
        const data: { text: string } = await response.json();
        setExtractedText(data.text || 'No text extracted');
      } catch (error) {
        console.error('Error:', error);
        setExtractedText('Failed to extract text from image');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Drug Interaction Checker</h1>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
        <input
          type="text"
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          placeholder="Enter drug name"
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <input
          type="file"
          onChange={handleImageUpload}
          accept="image/*"
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        {imageSrc && (
  <div className="mt-4">
    <ReactCrop
      crop={crop}
      onChange={(newCrop) => setCrop(newCrop)}
      onComplete={onCropComplete}
    >
      <img src={imageSrc.src} alt="Source" style={{maxWidth: '100%', height: 'auto'}} />
    </ReactCrop>
  </div>
)}
        {croppedImageBlob && (
          <button
            type="button"
            onClick={handleExtract}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Extract Text
          </button>
        )}
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Check Interactions
        </button>
      </form>
      {extractedText && (
        <div className="mt-4 w-full max-w-md bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Extracted Text:</h3>
          <p className="text-gray-700">{extractedText}</p>
        </div>
      )}
      {croppedImageUrl && (
        <div className="mt-4">
          <img src={croppedImageUrl} alt="Cropped" />
        </div>
      )}
      {result && (
        <div className="mt-8 w-full max-w-2xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Result:</h2>
          <div dangerouslySetInnerHTML={{ __html: result }} className="prose"></div>
        </div>
      )}
    </div>
  );
};

export default Home;