import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Preprocess image to improve OCR accuracy using Sharp
 */
export async function preprocessImage(imagePath: string): Promise<string> {
  try {
    console.log('🖼️  Starting image preprocessing with Sharp...');
    
    const processedDir = path.join(path.dirname(imagePath), 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const filename = path.basename(imagePath, path.extname(imagePath));
    const processedPath = path.join(processedDir, `${filename}_processed.jpg`);
    
    // Get image metadata first
    const metadata = await sharp(imagePath).metadata();
    console.log(`📏 Original size: ${metadata.width}x${metadata.height}`);
    
    // Process image with Sharp
    await sharp(imagePath)
      // Step 1: Auto-rotate based on EXIF
      .rotate()
      // Step 2: Resize if too large (max 2000px)
      .resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      // Step 3: Convert to grayscale
      .grayscale()
      // Step 4: Normalize brightness and contrast
      .normalize()
      // Step 5: Sharpen text
      .sharpen({
        sigma: 1.5,
        m1: 1,
        m2: 2
      })
      // Step 6: Increase contrast
      .linear(1.3, -(128 * 1.3) + 128)
      // Step 7: Save as high-quality JPEG
      .jpeg({ quality: 95 })
      .toFile(processedPath);
    
    const newMetadata = await sharp(processedPath).metadata();
    console.log(`📐 Processed size: ${newMetadata.width}x${newMetadata.height}`);
    console.log(`✅ Preprocessed image saved: ${processedPath}`);
    
    return processedPath;
    
  } catch (error) {
    console.error('❌ Image preprocessing error:', error);
    // Return original path if preprocessing fails
    return imagePath;
  }
}

/**
 * Advanced preprocessing with more aggressive enhancement
 */
export async function preprocessImageAdvanced(imagePath: string): Promise<string> {
  try {
    console.log('🖼️  Advanced preprocessing...');
    
    const processedDir = path.join(path.dirname(imagePath), 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const filename = path.basename(imagePath, path.extname(imagePath));
    const processedPath = path.join(processedDir, `${filename}_advanced.jpg`);
    
    await sharp(imagePath)
      .rotate() // Auto-rotate
      .resize(2500, 2500, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen({ sigma: 2 })
      .linear(1.5, -(128 * 1.5) + 128) // Higher contrast
      .median(3) // Reduce noise
      .jpeg({ quality: 100 })
      .toFile(processedPath);
    
    console.log(`✅ Advanced preprocessing complete: ${processedPath}`);
    return processedPath;
    
  } catch (error) {
    console.error('❌ Advanced preprocessing error:', error);
    return imagePath;
  }
}

/**
 * Preprocess for handwritten text (different approach)
 */
export async function preprocessHandwritten(imagePath: string): Promise<string> {
  try {
    console.log('🖼️  Preprocessing for handwritten text...');
    
    const processedDir = path.join(path.dirname(imagePath), 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    
    const filename = path.basename(imagePath, path.extname(imagePath));
    const processedPath = path.join(processedDir, `${filename}_handwritten.jpg`);
    
    await sharp(imagePath)
      .rotate()
      .resize(3000, 3000, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize()
      .blur(0.3) // Slight blur to smooth pen strokes
      .sharpen({ sigma: 1 })
      .threshold(128) // Binary threshold
      .jpeg({ quality: 100 })
      .toFile(processedPath);
    
    console.log(`✅ Handwritten preprocessing complete: ${processedPath}`);
    return processedPath;
    
  } catch (error) {
    console.error('❌ Handwritten preprocessing error:', error);
    return imagePath;
  }
}

/**
 * Clean up processed images
 */
export function cleanupProcessedImages(originalPath: string): void {
  try {
    const processedDir = path.join(path.dirname(originalPath), 'processed');
    if (fs.existsSync(processedDir)) {
      const files = fs.readdirSync(processedDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(processedDir, file));
      });
      fs.rmdirSync(processedDir);
      console.log('🗑️  Cleaned up processed images');
    }
  } catch (error) {
    console.error('⚠️  Cleanup error:', error);
  }
}
