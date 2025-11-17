import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PrescriptionAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    extractedText: string;
    medicines: ExtractedMedicine[];
    matches: MedicineMatch[];
  };
}

export interface ExtractedMedicine {
  medicineName: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

export interface MedicineMatch {
  extractedName: string;
  matchedProduct?: any;
  alternatives: any[];
  confidence: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = `${environment.apiUrl}/prescription`;

  constructor(private http: HttpClient) {}

  analyzePrescription(file: File): Observable<PrescriptionAnalysisResponse> {
    const formData = new FormData();
    formData.append('prescription', file);

    return this.http.post<PrescriptionAnalysisResponse>(
      `${this.apiUrl}/analyze`,
      formData
    );
  }
}
