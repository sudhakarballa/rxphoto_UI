export class SharePointService {
  private clientId = 'cccd3fbd-75b2-494c-8bb4-4250628ddf33';
  private tenantId = '9dde22fd-a45c-44b6-aef1-d110a7162789';
  private clientSecret = 'SSh8Q~C.Kev8hO3b8HQs5QwUQqb2D8xBHw~iubo5';

  private accessToken: string | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://graph.microsoft.com/.default'
        })
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      if (!this.accessToken) {
        throw new Error('Failed to get access token');
      }
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  private async getSiteId(): Promise<string> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://graph.microsoft.com/v1.0/sites?search=*`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    return data.value[0]?.id || 'root';
  }

  private async uploadToSharePoint(fileName: string, fileData: string): Promise<string> {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();
    const base64Data = fileData.split(',')[1];
    
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/Customerformuploader/${fileName}:/content`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    });

    const result = await response.json();
    return result.webUrl;
  }

  private async createListItem(listName: string, itemData: any): Promise<boolean> {
    const token = await this.getAccessToken();
    const siteId = await this.getSiteId();
    
    const listUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listName}/items`;
    
    const response = await fetch(listUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: itemData
      })
    });

    return response.ok;
  }

  async submitPatientForm(formData: any, capturedPhotos: {[key: string]: string}, signature?: string): Promise<{success: boolean, message: string, details?: any}> {
    try {
      const patientName = `${formData.firstName}_${formData.lastName}`;
      const timestamp = Date.now();
      
      // Upload photos
      const photoUrls: {[key: string]: string} = {};
      let uploadedPhotos = 0;
      
      for (const [angle, photoData] of Object.entries(capturedPhotos)) {
        const fileName = `${patientName}_${angle}_${timestamp}.png`;
        const photoUrl = await this.uploadToSharePoint(fileName, photoData);
        photoUrls[angle] = photoUrl;
        uploadedPhotos++;
      }

      // Upload signature
      let signatureUrl = '';
      if (signature) {
        const signatureFileName = `${patientName}_Signature_${timestamp}.png`;
        signatureUrl = await this.uploadToSharePoint(signatureFileName, signature);
      }

      // Create list item
      const listItem = {
        Title: `${formData.firstName} ${formData.lastName}`,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        Email: formData.email,
        MobileNumber: formData.mobileNumber,
        ProcedureName: formData.procedureName,
        DateOfBirth: formData.dateOfBirth,
        PhotoUrls: JSON.stringify(photoUrls),
        SignatureUrl: signatureUrl,
        SubmissionDate: new Date().toISOString()
      };

      const listSuccess = await this.createListItem('PatientPhotos', listItem);
      
      if (listSuccess) {
        return {
          success: true,
          message: `Successfully submitted patient form for ${formData.firstName} ${formData.lastName}`,
          details: {
            patientName: `${formData.firstName} ${formData.lastName}`,
            photosUploaded: uploadedPhotos,
            signatureUploaded: !!signature,
            submissionTime: new Date().toISOString(),
            listItemCreated: true
          }
        };
      } else {
        throw new Error('Failed to create list item in SharePoint');
      }
    } catch (error) {
      console.error('Error submitting to SharePoint:', error);
      
      return {
        success: false,
        message: `Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          patientName: `${formData.firstName} ${formData.lastName}`,
          photosAttempted: Object.keys(capturedPhotos).length,
          signatureAttempted: !!signature,
          submissionTime: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}