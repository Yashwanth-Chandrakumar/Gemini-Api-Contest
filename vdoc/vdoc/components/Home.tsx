"use client"
import { GoogleGenerativeAI } from '@google/generative-ai';
import React, { useState } from 'react';

// Use environment variable for API key
const genAI = new GoogleGenerativeAI("AIzaSyBr4esIdyu9KU9SM1pn541AnaPvidjN0JI");
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
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
        {text: `Drug name: ${drugName}`},
        {text: "Drug interaction: "},
      ];
      const response = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
      });
      setResult(response.response.text());
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while fetching the drug interaction information.');
    }
  };

  return (
    <div>
      <h1>Drug Interaction Checker</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          placeholder="Enter drug name"
          required
        />
        <button type="submit">Check Interactions</button>
      </form>
      {result && (
        <div>
          <h2>Result:</h2>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;