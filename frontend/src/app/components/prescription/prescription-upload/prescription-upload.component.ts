import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PrescriptionService, PrescriptionAnalysisResponse } from '../../../services/prescription.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-prescription-upload',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prescription-upload.component.html',
  styleUrls: ['./prescription-upload.component.scss']
})
export class PrescriptionUploadComponent {
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  analyzing = false;
  analysisResult: PrescriptionAnalysisResponse['data'] | null = null;
  showResults = false;

  constructor(
    private prescriptionService: PrescriptionService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Please select an image file', 'Invalid File');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('File size must be less than 5MB', 'File Too Large');
        return;
      }

      this.selectedFile = file;

      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files[0]) {
      const fakeEvent = {
        target: { files: [files[0]] }
      } as any;
      this.onFileSelected(fakeEvent);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.analysisResult = null;
    this.showResults = false;
  }

  analyzePrescription(): void {
    if (!this.selectedFile) {
      this.toastr.error('Please select a prescription image', 'No File');
      return;
    }

    this.analyzing = true;
    this.showResults = false;

    this.prescriptionService.analyzePrescription(this.selectedFile).subscribe({
      next: (response) => {
        if (response.success) {
          this.analysisResult = response.data;
          this.showResults = true;
          this.toastr.success('Prescription analyzed successfully!', 'Success');
        }
      },
      error: (error) => {
        this.analyzing = false;
        const errorMessage = error.error?.message || 'Failed to analyze prescription';
        this.toastr.error(errorMessage, 'Analysis Failed');
        console.error('Analysis error:', error);
      },
      complete: () => {
        this.analyzing = false;
      }
    });
  }

  getConfidenceBadgeClass(confidence: string): string {
    switch (confidence) {
      case 'high': return 'badge bg-success';
      case 'medium': return 'badge bg-warning';
      case 'low': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
