import { Request, Response } from 'express';
import * as aiService from '../services/aiPrescription.service';

export async function analyzePrescription(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file uploaded',
        hint: 'Please upload a clear image of the prescription'
      });
      return;
    }

    const imagePath = req.file.path;
    console.log(`📁 Processing prescription: ${imagePath}`);
    
    try {
      // STEP 1: Extract text from image
      console.log('🔍 Step 1: Extracting text from image...');
      const extractedText = await aiService.extractTextFromImage(imagePath);
      
      if (!extractedText || extractedText.length < 10) {
        aiService.deleteUploadedFile(imagePath);
        res.status(400).json({
          success: false,
          message: 'Could not extract readable text from image',
          hint: 'Please ensure the prescription is clearly visible and well-lit. Typed prescriptions work best.',
          extractedText: extractedText
        });
        return;
      }
      
      // STEP 2: Identify medicines using AI
      console.log('🤖 Step 2: Identifying medicines...');
      const medicines = await aiService.identifyMedicines(extractedText);
      
      if (medicines.length === 0) {
        aiService.deleteUploadedFile(imagePath);
        res.status(200).json({
          success: true,
          message: 'No medicines could be identified',
          hint: 'The image might be unclear or contain no medicine names. Try manual entry.',
          data: {
            extractedText: extractedText,
            medicines: [],
            matches: []
          }
        });
        return;
      }
      
      // STEP 3: Match with inventory
      console.log('📊 Step 3: Matching with inventory...');
      const matches = await aiService.matchMedicinesWithInventory(medicines);
      
      // Cleanup uploaded file
      aiService.deleteUploadedFile(imagePath);
      
      // Success response
      res.json({
        success: true,
        message: `Successfully identified ${medicines.length} medicine(s)`,
        data: {
          extractedText: extractedText,
          medicines: medicines,
          matches: matches
        }
      });
      
    } catch (processingError: any) {
      // Cleanup on processing error
      aiService.deleteUploadedFile(imagePath);
      
      console.error('❌ Processing error:', processingError);
      
      res.status(500).json({
        success: false,
        message: processingError.message || 'Failed to analyze prescription',
        hint: 'Try uploading a clearer image or use manual entry'
      });
    }
    
  } catch (error) {
    console.error('❌ Prescription analysis error:', error);
    
    if (req.file) {
      aiService.deleteUploadedFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      hint: 'Please try again or contact support'
    });
  }
}
