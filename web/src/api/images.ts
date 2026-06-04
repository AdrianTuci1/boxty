import { apiFetch } from './client'

export interface Image {
  id: string
  name: string
  image_url: string
  status: 'building' | 'ready' | 'failed'
  created_at: string
}

export function listImages() {
  return apiFetch<Image[]>('/images')
}

export function buildImage(payload: { name: string; base_image: string; commands: string[] }) {
  return apiFetch<Image>('/images/build', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteImage(id: string) {
  return apiFetch<void>(`/images/${id}`, { method: 'DELETE' })
}
