"use client"
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { marked } from 'marked';
import React, { useState } from 'react';
// Use environment variable for API key
const genAI = new GoogleGenerativeAI("AIzaSyBr4esIdyu9KU9SM1pn541AnaPvidjN0JI");
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",safetySettings
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parts = [
        {text: "Drug name: give the complete drug interaction and primary use of Warfarin"},
        {text: "Drug interaction: **Drug Name:** Warfarin\n\n**Primary Use:** Anticoagulant (prevents blood clots)\n\n**Drug Interactions:**\n\n* **Antibiotics:**\n    * **Rifampin:** Decreases warfarin effectiveness\n    * **Ciprofloxacin:** Increases warfarin effectiveness\n* **NSAIDs (Pain Relievers):**\n    * **Aspirin, Ibuprofen:** Increase warfarin effectiveness\n* **Other Anticoagulants:**\n    * **Heparin:** Additive anticoagulant effect\n* **Antidepressants:**\n    * **Fluoxetine:** Increases warfarin effectiveness\n* **Anticonvulsants:**\n    * **Carbamazepine:** Decreases warfarin effectiveness\n* **Antivirals:**\n    * **Ritonavir:** Increases warfarin effectiveness\n* **Herbal Supplements:**\n    * **Ginkgo biloba:** Increases bleeding risk\n    * **Garlic:** May increase anticoagulant effect\n* **Foods:**\n    * **Leafy green vegetables (e.g., spinach, kale):** High in vitamin K, which can reduce warfarin effectiveness"},
        {text: `Drug name: ${drugName} If the input is a valid drug name, provide the complete drug interaction and primary use information. If the input is not a recognized drug name, respond accordingly. Dont ask the user to talk with a doctor they know it they are just referring so dont add a note to consult a doctor as they are going to do it anyway.`},
        {text: "Drug interaction: "},
      ];
      const response = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig
      });
      const html = marked(response.response.text());
      setResult(html);
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while fetching the drug interaction information.');
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
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
        <button
          type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Check Interactions
        </button>
      </form>
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
