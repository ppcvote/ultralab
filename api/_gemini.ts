import { GoogleGenerativeAI } from '@google/generative-ai'

let _client: GoogleGenerativeAI | null = null

export function getGeminiClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
    }
    _client = new GoogleGenerativeAI(apiKey)
  }
  return _client
}

export const GEMINI_MODEL = 'gemini-2.5-flash'
