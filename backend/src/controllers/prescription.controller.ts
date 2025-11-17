import { Request, Response } from 'express';
import * as aiService from '../services/aiPrescription.service';

export async function analyzePrescription(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
      return;
    }

    const imagePath = req.file.path;
    console.log('📋 Analyzing prescription:', imagePath);

    // Step 1: Extract text using OCR
    const extractedText = await aiService.extractTextFromImage(imagePath);

    if (!extractedText || extractedText.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'Could not extract readable text from image. Please ensure the image is clear.'
      });
      aiService.deleteUploadedFile(imagePath);
      return;
    }

    // Step 2: Identify medicines using AI
    const medicines = await aiService.identifyMedicines(extractedText);

    if (medicines.length === 0) {
      res.status(404).json({
        success: false,
        message: 'No medicines identified in the prescription'
      });
      aiService.deleteUploadedFile(imagePath);
      return;
    }

    // Step 3: Match with inventory and suggest alternatives
    const matches = await aiService.matchMedicinesWithInventory(medicines);

    // Step 4: Enhance alternatives with AI ranking
    for (const match of matches) {
      if (match.alternatives.length > 0) {
        match.alternatives = await aiService.suggestAlternatives(
          match.extractedName,
          match.alternatives
        );
      }
    }

    // Clean up uploaded file
    aiService.deleteUploadedFile(imagePath);

    res.json({
      success: true,
      message: 'Prescription analyzed successfully',
      data: {
        extractedText: extractedText,
        medicines: medicines,
        matches: matches
      }
    });

  } catch (error) {
    console.error('❌ Prescription analysis error:', error);
    
    // Clean up file on error
    if (req.file) {
      aiService.deleteUploadedFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to analyze prescription. Please try again.'
    });
  }
}
