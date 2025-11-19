import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import type { ApiResponse, Incident, User, PlaybookTemplate, Artifact, Reference } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Incidents
  async getIncidents(): Promise<ApiResponse<Incident[]>> {
    const response: AxiosResponse<ApiResponse<Incident[]>> = await this.client.get('/api/incidents')
    return response.data
  }

  async getIncident(id: string): Promise<ApiResponse<Incident>> {
    const response: AxiosResponse<ApiResponse<Incident>> = await this.client.get(`/api/incidents/${id}`)
    return response.data
  }

  async createIncident(incident: Partial<Incident>): Promise<ApiResponse<Incident>> {
    const response: AxiosResponse<ApiResponse<Incident>> = await this.client.post('/api/incidents', incident)
    return response.data
  }

  async updateIncident(id: string, incident: Partial<Incident>): Promise<ApiResponse<Incident>> {
    const response: AxiosResponse<ApiResponse<Incident>> = await this.client.put(`/api/incidents/${id}`, incident)
    return response.data
  }

  async deleteIncident(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(`/api/incidents/${id}`)
    return response.data
  }

  // Users
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response: AxiosResponse<ApiResponse<User[]>> = await this.client.get('/api/users')
    return response.data
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get(`/api/users/${id}`)
    return response.data
  }

  async createUser(user: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.post('/api/users', user)
    return response.data
  }

  async updateUser(id: string, user: Partial<User>): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.put(`/api/users/${id}`, user)
    return response.data
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(`/api/users/${id}`)
    return response.data
  }

  // Playbooks
  async getPlaybooks(): Promise<ApiResponse<PlaybookTemplate[]>> {
    const response: AxiosResponse<ApiResponse<PlaybookTemplate[]>> = await this.client.get('/api/playbooks')
    return response.data
  }

  async getPlaybook(id: string): Promise<ApiResponse<PlaybookTemplate>> {
    const response: AxiosResponse<ApiResponse<PlaybookTemplate>> = await this.client.get(`/api/playbooks/${id}`)
    return response.data
  }

  async createPlaybook(playbook: Partial<PlaybookTemplate>): Promise<ApiResponse<PlaybookTemplate>> {
    const response: AxiosResponse<ApiResponse<PlaybookTemplate>> = await this.client.post('/api/playbooks', playbook)
    return response.data
  }

  async updatePlaybook(id: string, playbook: Partial<PlaybookTemplate>): Promise<ApiResponse<PlaybookTemplate>> {
    const response: AxiosResponse<ApiResponse<PlaybookTemplate>> = await this.client.put(`/api/playbooks/${id}`, playbook)
    return response.data
  }

  async deletePlaybook(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(`/api/playbooks/${id}`)
    return response.data
  }

  // Artifacts
  async createArtifact(incidentId: string, artifact: Partial<Artifact>): Promise<ApiResponse<Artifact>> {
    const response: AxiosResponse<ApiResponse<Artifact>> = await this.client.post(`/api/incidents/${incidentId}/artifacts`, artifact)
    return response.data
  }

  async updateArtifact(id: string, artifact: Partial<Artifact>): Promise<ApiResponse<Artifact>> {
    const response: AxiosResponse<ApiResponse<Artifact>> = await this.client.put(`/api/artifacts/${id}`, artifact)
    return response.data
  }

  async deleteArtifact(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(`/api/artifacts/${id}`)
    return response.data
  }

  async getArtifact(id: string): Promise<ApiResponse<Artifact>> {
    const response: AxiosResponse<ApiResponse<Artifact>> = await this.client.get(`/api/artifacts/${id}`)
    return response.data
  }

  // References
  async createReference(incidentId: string, reference: Partial<Reference>): Promise<ApiResponse<Reference>> {
    const response: AxiosResponse<ApiResponse<Reference>> = await this.client.post(`/api/incidents/${incidentId}/references`, reference)
    return response.data
  }

  async updateReference(id: string, reference: Partial<Reference>): Promise<ApiResponse<Reference>> {
    const response: AxiosResponse<ApiResponse<Reference>> = await this.client.put(`/api/references/${id}`, reference)
    return response.data
  }

  async deleteReference(id: string): Promise<ApiResponse<void>> {
    const response: AxiosResponse<ApiResponse<void>> = await this.client.delete(`/api/references/${id}`)
    return response.data
  }

  // Files (upload and manage files for incidents)
  async uploadFileToIncident(incidentId: string, file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)

    const response: AxiosResponse<ApiResponse<any>> = await this.client.post(
      `/api/incidents/${incidentId}/files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return response.data
  }

  async downloadFile(incidentId: string, filename: string): Promise<Blob> {
    const response = await this.client.get(`/api/incidents/${incidentId}/files/${filename}`, {
      responseType: 'blob'
    })
    return response.data
  }

  async removeFileFromIncident(incidentId: string, storedFilename: string): Promise<ApiResponse<Incident>> {
    const response: AxiosResponse<ApiResponse<Incident>> = await this.client.delete(`/api/incidents/${incidentId}/files/${storedFilename}`)
    return response.data
  }

  // Related Tickets
  async addRelatedTicket(incidentId: string, relatedTicketId: string): Promise<ApiResponse<Incident>> {
    const response: AxiosResponse<ApiResponse<Incident>> = await this.client.post(`/api/incidents/${incidentId}/related-tickets`, { relatedTicketId })
    return response.data
  }

  async removeRelatedTicket(incidentId: string, relatedTicketId: string): Promise<ApiResponse<Incident>> {
    const response: AxiosResponse<ApiResponse<Incident>> = await this.client.delete(`/api/incidents/${incidentId}/related-tickets/${relatedTicketId}`)
    return response.data
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health')
    return response.data
  }
}

export default new ApiClient()
