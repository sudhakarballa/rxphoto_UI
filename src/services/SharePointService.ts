import axios from 'axios';

export class SharePointService {
  private siteUrl: string;
  private listName: string;
  private accessToken: string;

  constructor() {
    // Configure these based on your SharePoint setup
    this.siteUrl = process.env.REACT_APP_SHAREPOINT_SITE_URL || '';
    this.listName = process.env.REACT_APP_SHAREPOINT_LIST_NAME || 'PatientForms';
    this.accessToken = process.env.REACT_APP_SHAREPOINT_ACCESS_TOKEN || '';
  }

  // Get access token using client credentials
  private async getAccessToken(): Promise<string> {
    try {
      const tokenUrl = `https://accounts.accesscontrol.windows.net/${process.env.REACT_APP_TENANT_ID}/tokens/OAuth/2`;
      
      const response = await axios.post(tokenUrl, {
        grant_type: 'client_credentials',
        client_id: process.env.REACT_APP_CLIENT_ID,
        client_secret: process.env.REACT_APP_CLIENT_SECRET,
        resource: `00000003-0000-0ff1-ce00-000000000000/${this.siteUrl.split('/')[2]}@${process.env.REACT_APP_TENANT_ID}`
      });

      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Upload image to SharePoint document library
  private async uploadImage(imageData: string, fileName: string): Promise<string> {
    try {
      const token = await this.getAccessToken();
      
      // Convert base64 to blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      
      const uploadUrl = `${this.siteUrl}/_api/web/lists/getbytitle('PatientImages')/RootFolder/Files/Add(url='${fileName}',overwrite=true)`;
      
      const response = await axios.post(uploadUrl, byteArray, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/octet-stream'
        }
      });

      return response.data.d.ServerRelativeUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Submit patient form data to SharePoint list
  async submitPatientForm(formData: any, capturedPhotos: {[key: string]: string}, signature?: string): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      
      // Upload images and get their URLs
      const imageUrls: {[key: string]: string} = {};
      
      for (const [angle, imageData] of Object.entries(capturedPhotos)) {
        const fileName = `${formData.mobileNumber}_${angle}_${Date.now()}.png`;
        const imageUrl = await this.uploadImage(imageData, fileName);
        imageUrls[angle] = imageUrl;
      }

      // Upload signature if exists
      let signatureUrl = '';
      if (signature) {
        const signatureFileName = `${formData.mobileNumber}_signature_${Date.now()}.png`;
        signatureUrl = await this.uploadImage(signature, signatureFileName);
      }

      // Create list item
      const listUrl = `${this.siteUrl}/_api/web/lists/getbytitle('${this.listName}')/items`;
      
      const listItem = {
        Title: `${formData.firstName} ${formData.lastName}`,
        FirstName: formData.firstName,
        LastName: formData.lastName,
        Email: formData.email,
        MobileNumber: formData.mobileNumber,
        ProcedureName: formData.procedureName,
        DateOfBirth: formData.dateOfBirth,
        PhotoUrls: JSON.stringify(imageUrls),
        SignatureUrl: signatureUrl,
        SubmissionDate: new Date().toISOString()
      };

      const response = await axios.post(listUrl, listItem, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': await this.getFormDigest()
        }
      });

      return response.status === 201;
    } catch (error) {
      console.error('Error submitting to SharePoint:', error);
      return false;
    }
  }

  // Get form digest for POST requests
  private async getFormDigest(): Promise<string> {
    try {
      const token = await this.getAccessToken();
      const digestUrl = `${this.siteUrl}/_api/contextinfo`;
      
      const response = await axios.post(digestUrl, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose'
        }
      });

      return response.data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      console.error('Error getting form digest:', error);
      throw error;
    }
  }
}