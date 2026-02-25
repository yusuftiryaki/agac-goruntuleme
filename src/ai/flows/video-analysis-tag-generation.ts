'use server';
/**
 * @fileOverview This file implements a Genkit flow for analyzing a video of a pistachio tree
 * to generate descriptive tags about its condition.
 *
 * - analyzeVideoForTags - A function that handles the video analysis process and tag generation.
 * - VideoAnalysisTagGenerationInput - The input type for the analyzeVideoForTags function.
 * - VideoAnalysisTagGenerationOutput - The return type for the analyzeVideoForTags function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Define Input Schema
const VideoAnalysisTagGenerationInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of a pistachio tree, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VideoAnalysisTagGenerationInput = z.infer<typeof VideoAnalysisTagGenerationInputSchema>;

// Define Output Schema
const VideoAnalysisTagGenerationOutputSchema = z.object({
  tags: z.array(z.string()).describe("A list of descriptive tags about the pistachio tree's condition, e.g., 'Healthy', 'Disease Symptoms', 'Dense Foliage'."),
});
export type VideoAnalysisTagGenerationOutput = z.infer<typeof VideoAnalysisTagGenerationOutputSchema>;

// Define the prompt
const videoAnalysisTagPrompt = ai.definePrompt({
  name: 'videoAnalysisTagPrompt',
  input: { schema: VideoAnalysisTagGenerationInputSchema },
  output: { schema: VideoAnalysisTagGenerationOutputSchema },
  model: googleAI.model('gemini-1.5-flash'), // Use a multimodal model capable of processing media
  prompt: `You are an expert botanist specializing in pistachio trees. Your task is to analyze the provided video of a pistachio tree and extract key descriptive tags about its condition.

Focus on aspects such as:
- Overall health (e.g., 'Healthy', 'Unhealthy', 'Stressed')
- Presence of diseases or pests (e.g., 'Disease Symptoms', 'Pest Infestation')
- Foliage density and color (e.g., 'Dense Foliage', 'Sparse Foliage', 'Yellowing Leaves', 'Green Leaves')
- Tree structure and development (e.g., 'Mature Tree', 'Young Tree', 'Strong Branches')
- Environmental factors visible (e.g., 'Dry Soil', 'Irrigated Area')

Provide these tags as a JSON array of strings. Do not include any other text in your response.
Video content to analyze: {{media url=videoDataUri}}
`,
});

// Define the Genkit flow
const videoAnalysisTagGenerationFlow = ai.defineFlow(
  {
    name: 'videoAnalysisTagGenerationFlow',
    inputSchema: VideoAnalysisTagGenerationInputSchema,
    outputSchema: VideoAnalysisTagGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await videoAnalysisTagPrompt(input);
    return output!;
  }
);

// Exported wrapper function
export async function analyzeVideoForTags(
  input: VideoAnalysisTagGenerationInput
):
  Promise<VideoAnalysisTagGenerationOutput> {
  return videoAnalysisTagGenerationFlow(input);
}
