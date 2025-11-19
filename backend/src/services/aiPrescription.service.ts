import Tesseract from 'tesseract.js';
import Groq from 'groq-sdk';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';
import fs from 'fs';
import { preprocessImage, cleanupProcessedImages } from './imagePreprocessing.service';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

interface ExtractedMedicine {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  confidence?: string;
}

interface MedicineMatch {
  extractedName: string;
  matchedProduct?: any;
  alternatives: any[];
  confidence: string;
}

/**
 * Extract text from prescription image using OCR with preprocessing
 */
export async function extractTextFromImage(imagePath: string): Promise<string> {
  let preprocessedPath: string | null = null;
  
  try {
    console.log('📸 Starting OCR process for:', imagePath);
    
    // STEP 1: Preprocess image for better OCR
    console.log('🔧 Preprocessing image...');
    preprocessedPath = await preprocessImage(imagePath);
    
    // STEP 2: Configure Tesseract for medical text
    console.log('🔍 Running OCR...');
    
    // ✅ FIXED: Use simple configuration without PSM
    const { data: { text, confidence } } = await Tesseract.recognize(
      preprocessedPath,
      'eng',
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    console.log(`✅ OCR completed with ${confidence}% confidence`);
    console.log(`📝 Extracted text length: ${text.length} characters`);
    
    // STEP 3: Clean extracted text
    const cleanedText = cleanExtractedText(text);
    console.log(`🧹 Cleaned text length: ${cleanedText.length} characters`);
    
    // STEP 4: Cleanup processed files
    if (preprocessedPath !== imagePath) {
      try {
        if (preprocessedPath) {
          fs.unlinkSync(preprocessedPath);
        }
      } catch (e) {
        console.log('⚠️  Could not delete preprocessed image');
      }
    }
    
    if (cleanedText.length < 10) {
      console.log('⚠️  Extracted text is too short, might be low quality image');
      return text; // Return original if cleaning made it too short
    }
    
    return cleanedText;
    
  } catch (error) {
    console.error('❌ OCR Error:', error);
    
    // Cleanup on error
    if (preprocessedPath && preprocessedPath !== imagePath) {
      try {
        fs.unlinkSync(preprocessedPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    throw new Error('Failed to extract text from image. Please ensure the image is clear and contains readable text.');
  }
}


/**
 * Clean and normalize extracted text
 */
function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that might confuse AI
    .replace(/[^\w\s.,()/-:]/g, '')
    // Trim
    .trim()
    // Capitalize properly (medicine names are often uppercase)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Use Groq AI to identify medicines with improved prompting
 */
export async function identifyMedicines(extractedText: string): Promise<ExtractedMedicine[]> {
  try {
    console.log('🤖 Identifying medicines using Groq AI...');
    console.log(`📄 Processing ${extractedText.length} characters of text`);

    const prompt = `You are an expert medical prescription analyzer with deep knowledge of pharmaceutical names and medical terminology.

EXTRACTED PRESCRIPTION TEXT:
${extractedText}

TASK: Extract all medicine/drug names from the above text.

INSTRUCTIONS:
1. Identify ALL medicine names, even if partially visible or misspelled
2. Use your medical knowledge to correct common OCR errors:
   - "PARACETAM0L" → "PARACETAMOL" (0 → O)
   - "C0DEINE" → "CODEINE"
   - "AMOXICILL1N" → "AMOXICILLIN" (1 → I)
3. Recognize both generic and brand names
4. Extract dosage if visible (e.g., 500mg, 10mg, 250mg)
5. Extract frequency if visible (e.g., "1 Morning", "twice daily", "1x1", "BD")
6. Extract duration if visible (e.g., "5 days", "1 week", "x 3 days")
7. For unclear text, use context and medical knowledge to infer the likely medicine

COMMON MEDICINE PATTERNS:
- TAB. [Medicine Name] = Tablet
- CAP. [Medicine Name] = Capsule
- SYR. [Medicine Name] = Syrup
- INJ. [Medicine Name] = Injection

RETURN FORMAT:
Return ONLY a valid JSON array. Each medicine should include a confidence level:
[
  {
    "medicineName": "PARACETAMOL",
    "confidence": "high",
    "dosage": "500mg",
    "frequency": "twice daily",
    "duration": "5 days"
  }
]

CONFIDENCE LEVELS:
- "high": Medicine name is clear and unambiguous
- "medium": Medicine name is partially visible but inferable
- "low": Medicine name is unclear but possible match

If NO medicines can be identified, return: []

IMPORTANT: Return ONLY the JSON array, no additional text.

JSON Response:`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a medical prescription analyzer. Always return valid JSON arrays. Use medical knowledge to correct OCR errors in medicine names.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Lower temperature for more consistent output
      max_tokens: 2048
    });

   const content = chatCompletion.choices[0]?.message?.content || '';
console.log('🤖 AI Raw Response:', content);

// Extract JSON from response (handle markdown code blocks)
let jsonMatch = content.match(/\[[\s\S]*\]/);

if (!jsonMatch) {
  // ✅ FIXED: Try to find JSON in markdown code block
  const codeBlockMatch = content.match(/``````/);
  if (codeBlockMatch) {
    jsonMatch = [codeBlockMatch[1]];
  }
}

if (!jsonMatch) {
  console.log('⚠️  No medicines identified in text');
  console.log('💡 Returning empty array - manual entry recommended');
  return [];
}


    const medicines: ExtractedMedicine[] = JSON.parse(jsonMatch[0]);
    
    // Filter out low confidence results if needed
    const filteredMedicines = medicines.filter(m => {
      if (!m.confidence || m.confidence !== 'low') {
        return true;
      }
      console.log(`⚠️  Low confidence medicine: ${m.medicineName}`);
      return true; // Keep low confidence too, but log it
    });
    
    console.log(`✅ Identified ${filteredMedicines.length} medicines`);
    filteredMedicines.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.medicineName} (${m.confidence || 'unknown'} confidence)`);
    });
    
    return filteredMedicines;
    
  } catch (error) {
    console.error('❌ AI Identification Error:', error);
    
    if (error instanceof SyntaxError) {
      console.error('⚠️  AI returned invalid JSON');
      return [];
    }
    
    throw new Error('Failed to identify medicines using AI. The text might be too unclear or the image quality too low.');
  }
}

/**
 * Match extracted medicines with database products (improved fuzzy matching)
 */
export async function matchMedicinesWithInventory(
  extractedMedicines: ExtractedMedicine[]
): Promise<MedicineMatch[]> {
  try {
    console.log('🔍 Matching medicines with inventory...');

    const matches: MedicineMatch[] = [];

    for (const medicine of extractedMedicines) {
      const medicineName = medicine.medicineName.toUpperCase();
      console.log(`🔎 Searching for: ${medicineName}`);

      // STEP 1: Try exact match
      const [exactMatches] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Products 
         WHERE UPPER(ProductName) = ?
         AND IsActive = TRUE 
         AND StockQty > 0
         LIMIT 1`,
        [medicineName]
      );

      if (exactMatches.length > 0) {
        console.log(`✅ Exact match found: ${exactMatches[0].ProductName}`);
      }

      // STEP 2: Try partial match (contains)
      const [partialMatches] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Products 
         WHERE UPPER(ProductName) LIKE ?
         AND IsActive = TRUE 
         AND StockQty > 0
         ORDER BY StockQty DESC
         LIMIT 1`,
        [`%${medicineName}%`]
      );

      // STEP 3: Try reverse partial match (medicine name contains product name)
      const [reverseMatches] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Products 
         WHERE ? LIKE CONCAT('%', UPPER(ProductName), '%')
         AND IsActive = TRUE 
         AND StockQty > 0
         ORDER BY StockQty DESC
         LIMIT 1`,
        [medicineName]
      );

      // STEP 4: Search for alternatives by composition
      const [alternatives] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM Products 
         WHERE (UPPER(Composition) LIKE ? OR UPPER(ProductName) LIKE ?)
         AND IsActive = TRUE 
         AND StockQty > 0
         ORDER BY StockQty DESC
         LIMIT 5`,
        [`%${medicineName}%`, `%${medicineName}%`]
      );

      // Determine best match
      let matchedProduct = null;
      let confidence = 'low';

      if (exactMatches.length > 0) {
        matchedProduct = exactMatches[0];
        confidence = 'high';
      } else if (partialMatches.length > 0) {
        matchedProduct = partialMatches[0];
        confidence = 'medium';
      } else if (reverseMatches.length > 0) {
        matchedProduct = reverseMatches[0];
        confidence = 'medium';
      }

      matches.push({
        extractedName: medicine.medicineName,
        matchedProduct: matchedProduct,
        alternatives: alternatives || [],
        confidence: confidence
      });

      console.log(`   Confidence: ${confidence}, Alternatives: ${alternatives.length}`);
    }

    console.log(`✅ Matching completed: ${matches.length} medicines processed`);
    return matches;
    
  } catch (error) {
    console.error('❌ Matching Error:', error);
    throw new Error('Failed to match medicines with inventory');
  }
}

/**
 * Suggest alternative medicines using AI (unchanged)
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
    
    const ranked = rankedNames
      .map(name => availableProducts.find(p => p.ProductName === name))
      .filter(Boolean);

    console.log(`✅ Alternatives suggested: ${ranked.length}`);
    return ranked;
    
  } catch (error) {
    console.error('❌ Alternative Suggestion Error:', error);
    return availableProducts;
  }
}

/**
 * Clean up uploaded file
 */
export function deleteUploadedFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️  Cleaned up file:', filePath);
    }
  } catch (error) {
    console.error('⚠️  File cleanup error:', error);
  }
}
