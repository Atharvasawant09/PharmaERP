import Tesseract from 'tesseract.js';
import Groq from 'groq-sdk';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import fs from 'fs';

// Initialize Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

interface ExtractedMedicine {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

interface MedicineMatch {
  extractedName: string;
  matchedProduct?: any;
  alternatives: any[];
  confidence: string;
}

/**
 * Extract text from prescription image using OCR
 */
export async function extractTextFromImage(imagePath: string): Promise<string> {
  try {
    console.log('📸 Extracting text from image:', imagePath);
    
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log('✅ OCR completed. Extracted text length:', text.length);
    return text;
  } catch (error) {
    console.error('❌ OCR Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Use Groq AI to identify medicines from extracted text
 */
export async function identifyMedicines(extractedText: string): Promise<ExtractedMedicine[]> {
  try {
    console.log('🤖 Identifying medicines using Groq AI...');

    const prompt = `You are a medical prescription analyzer. Extract medicine information from the following prescription text.

Prescription Text:
${extractedText}

Instructions:
1. Identify ALL medicine names mentioned
2. Extract dosage if mentioned (e.g., 500mg, 10mg)
3. Extract frequency if mentioned (e.g., twice daily, 3 times a day)
4. Extract duration if mentioned (e.g., 5 days, 2 weeks)

Return ONLY a valid JSON array in this exact format:
[
  {
    "medicineName": "Medicine Name",
    "dosage": "500mg",
    "frequency": "twice daily",
    "duration": "5 days"
  }
]

If no medicines found, return: []

JSON Response:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1024
    });

    const content = chatCompletion.choices[0]?.message?.content || '';
    console.log('🤖 AI Raw Response:', content);
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.log('⚠️ No medicines identified in text');
      return [];
    }

    const medicines: ExtractedMedicine[] = JSON.parse(jsonMatch[0]);
    console.log('✅ Identified medicines:', medicines.length);
    
    return medicines;
  } catch (error) {
    console.error('❌ AI Identification Error:', error);
    throw new Error('Failed to identify medicines');
  }
}

/**
 * Match extracted medicines with database products
 */
export async function matchMedicinesWithInventory(
  extractedMedicines: ExtractedMedicine[]
): Promise<MedicineMatch[]> {
  try {
    console.log('🔍 Matching medicines with inventory...');

    const matches: MedicineMatch[] = [];

    for (const medicine of extractedMedicines) {
      const medicineName = medicine.medicineName;

      // Search for exact or similar match
      const [exactMatches] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Products 
         WHERE ProductName LIKE ? 
         AND IsActive = TRUE 
         AND StockQty > 0
         LIMIT 1`,
        [`%${medicineName}%`]
      );

      // Search for alternatives by composition
      const [alternatives] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Products 
         WHERE (Composition LIKE ? OR ProductName LIKE ?)
         AND IsActive = TRUE 
         AND StockQty > 0
         ORDER BY StockQty DESC
         LIMIT 5`,
        [`%${medicineName}%`, `%${medicineName}%`]
      );

      matches.push({
        extractedName: medicineName,
        matchedProduct: exactMatches[0] || null,
        alternatives: alternatives || [],
        confidence: exactMatches.length > 0 ? 'high' : 
                    alternatives.length > 0 ? 'medium' : 'low'
      });
    }

    console.log('✅ Matching completed:', matches.length, 'medicines processed');
    return matches;
  } catch (error) {
    console.error('❌ Matching Error:', error);
    throw new Error('Failed to match medicines with inventory');
  }
}

/**
 * Suggest alternative medicines using Groq AI
 */
export async function suggestAlternatives(
  medicineName: string,
  availableProducts: any[]
): Promise<any[]> {
  try {
    console.log('💡 Suggesting alternatives for:', medicineName);

    if (availableProducts.length === 0) {
      return [];
    }

    const productList = availableProducts.map(p => 
      `${p.ProductName} (${p.Composition}) - Stock: ${p.StockQty}`
    ).join('\n');

    const prompt = `You are a pharmacist. A customer needs "${medicineName}" but it's not available or out of stock.

Available alternatives in inventory:
${productList}

Task: Rank these alternatives from most to least suitable based on:
1. Similar composition/active ingredient
2. Similar dosage strength
3. Same therapeutic category

Return ONLY a JSON array of product names in order of suitability:
["Product Name 1", "Product Name 2", "Product Name 3"]

If no suitable alternatives, return: []

JSON Response:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 512
    });

    const content = chatCompletion.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      return availableProducts;
    }

    const rankedNames: string[] = JSON.parse(jsonMatch[0]);
    
    // Reorder products based on AI ranking
    const ranked = rankedNames
      .map(name => availableProducts.find(p => p.ProductName === name))
      .filter(Boolean);

    console.log('✅ Alternatives suggested:', ranked.length);
    return ranked;
  } catch (error) {
    console.error('❌ Alternative Suggestion Error:', error);
    return availableProducts; // Return unranked if AI fails
  }
}

/**
 * Clean up uploaded file
 */
export function deleteUploadedFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Cleaned up file:', filePath);
    }
  } catch (error) {
    console.error('⚠️ File cleanup error:', error);
  }
}
