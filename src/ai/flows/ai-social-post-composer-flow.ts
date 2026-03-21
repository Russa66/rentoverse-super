
'use server';
/**
 * @fileOverview An AI-powered tool to automatically draft engaging and relevant social media posts
 *               for Facebook and WhatsApp groups based on a new room listing or search request.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComposeSocialPostInputSchema = z.object({
  type: z.enum(['listing', 'requirement']).default('listing'),
  location: z.string().describe('Precise location of the room or preferred area.'),
  nearestCommunication: z.string().optional().describe('Nearest public transportation options.'),
  wifiAvailable: z.boolean().optional(),
  inverterAvailable: z.boolean().optional(),
  acAvailable: z.boolean().optional(),
  waterSupplyCondition: z.string().optional(),
  monthlyRent: z.string().describe('Rent amount or budget.'),
  socialMediaType: z.enum(['facebook', 'whatsapp']).describe('The target platform.'),
});
export type ComposeSocialPostInput = z.infer<typeof ComposeSocialPostInputSchema>;

const ComposeSocialPostOutputSchema = z.object({
  postContent: z.string().describe('The generated social media post content.'),
});
export type ComposeSocialPostOutput = z.infer<typeof ComposeSocialPostOutputSchema>;

export async function composeSocialPost(input: ComposeSocialPostInput): Promise<ComposeSocialPostOutput> {
  return composeSocialPostFlow(input);
}

const composeSocialPostPrompt = ai.definePrompt({
  name: 'composeSocialPostPrompt',
  input: { schema: ComposeSocialPostInputSchema },
  output: { schema: ComposeSocialPostOutputSchema },
  prompt: `You are an AI social media content creator for RentoVerse.
Your task is to generate a compelling social media post for {{socialMediaType}}.

{{#if (eq type "listing")}}
Type: Room Available for Rent
Details:
- Location: {{{location}}}
- Nearest Communication: {{{nearestCommunication}}}
- Monthly Rent: {{monthlyRent}}
- Amenities: {{#if wifiAvailable}}WiFi, {{/if}}{{#if inverterAvailable}}Inverter, {{/if}}{{#if acAvailable}}AC{{/if}}
- Water: {{{waterSupplyCondition}}}
Tone: Professional and inviting.
{{else}}
Type: Looking for a Room (Tenant Requirement)
Details:
- Preferred Location: {{{location}}}
- Budget: {{monthlyRent}}
Tone: Urgent and friendly.
{{/if}}

Draft an engaging post with relevant emojis and hashtags.`,
});

const composeSocialPostFlow = ai.defineFlow(
  {
    name: 'composeSocialPostFlow',
    inputSchema: ComposeSocialPostInputSchema,
    outputSchema: ComposeSocialPostOutputSchema,
  },
  async (input) => {
    const { output } = await composeSocialPostPrompt(input);
    return output!;
  }
);
