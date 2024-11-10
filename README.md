
# VDoc: Drug Interaction and Health Assistant

## Overview

**VDoc** is a cutting-edge web application built using **Next.js** that leverages the power of **Gemini LLM**, **Google Lens**, and specialized AI assistants such as **Chef** and **Nutritionist** to provide users with reliable information about drug interactions and personalized health recommendations. Developed as part of the **Gemini Developer Contest** by Google, **VDoc** is designed to help users identify potential drug interactions, receive expert advice on diet and nutrition, and ensure their health decisions are well-informed.

## Features

- **Drug Interaction Check**: Utilizes **Gemini LLM** to analyze drug names and check for potential interactions.
- **Google Lens Integration**: Scan and identify drug names using **Google Lens** to get quick information and interaction checks.
- **AI-Powered Health Assistants**:
  - **Chef**: Provides recipe suggestions based on dietary needs and health goals.
  - **Nutritionist**: Offers personalized nutrition advice to help you maintain a healthy lifestyle.
- **Trained LLM**: The application is powered by a highly-trained language model for accurate and up-to-date drug interaction information.

## Technologies

- **Next.js**: For server-side rendering, routing, and building a fast, SEO-friendly React application.
- **Gemini LLM**: Trained model for processing and analyzing drug interactions.
- **Google Lens**: For image recognition of drug names.
- **Node.js & React**: For efficient backend and frontend development.

## Getting Started

To get started with VDoc, follow these steps:

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud account (for using Google Lens API and Gemini LLM)

### Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/vdoc.git
   ```

2. Navigate into the project folder:

   ```bash
   cd vdoc
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

   or if using yarn:

   ```bash
   yarn install
   ```

4. Set up your environment variables:

   Create a `.env.local` file in the root directory and add your necessary API keys for **Google Lens** and **Gemini LLM**.

   Example:

   ```
   GOOGLE_LENS_API_KEY=your_google_lens_api_key
   GEMINI_LLM_API_KEY=your_gemini_llm_api_key
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

   or if using yarn:

   ```bash
   yarn dev
   ```

   Visit `http://localhost:3000` to view the application.

## Usage

1. **Scan Drugs**: Use the Google Lens integration to scan drug labels and identify their names.
2. **Drug Interaction Check**: Once the drug name is identified, the app will check for potential interactions using the Gemini LLM model.
3. **Health Assistants**: Access the Chef for healthy recipes and the Nutritionist for personalized dietary recommendations based on your preferences and health goals.
