'use server';
/**
 * @fileOverview An AI-powered tool to automatically draft engaging and relevant social media posts
 *               for Facebook and WhatsApp groups based on a new room listing.
 *
 * - composeSocialPost - A function that generates a social media post.
 * - ComposeSocialPostInput - The input type for the composeSocialPost function.
 * - ComposeSocialPostOutput - The return type for the composeSocialPost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComposeSocialPostInputSchema = z.object({
  location: z.string().describe('Precise location of the room (e.g., "123 Main St, Anytown, CA").'),
  nearestCommunication: z
    .string()
    .describe('Nearest public transportation options (e.g., "5-min walk to Central Station, Bus Stop 100 ft away").'),
  wifiAvailable: z.boolean().describe('Whether Wi-Fi is available.'),
  inverterAvailable: z.boolean().describe('Whether an inverter (power backup) is available.'),
  acAvailable: z.boolean().describe('Whether air conditioning is available.'),
  waterSupplyCondition: z.string().describe('Condition of water supply (e.g., "24/7 municipal water supply").'),
  monthlyRent: z.string().describe('Monthly rent (e.g., "$500/month", "₹8000 per month").'),
  photoUrls: z.array(z.string().url()).describe('URLs of photos of the room.').optional(),
  socialMediaType: z.enum(['facebook', 'whatsapp']).describe('The social media platform for which the post is being generated.'),
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
  prompt: `You are an AI social media content creator specializing in crafting engaging posts for room rentals.
Your task is to generate a compelling social media post for a new room listing.
The post should be tailored for {{socialMediaType}}.

Here are the details of the room listing:
- Location: {{{location}}}
- Nearest Communication: {{{nearestCommunication}}}
- Monthly Rent: {{monthlyRent}}
- Amenities:
  - Wi-Fi: {{#if wifiAvailable}}Available{{else}}Not Available{{/if}}
  - Inverter/Power Backup: {{#if inverterAvailable}}Available{{else}}Not Available{{/if}}
  - AC: {{#if acAvailable}}Available{{else}}Not Available{{/if}}
  - Water Supply: {{{waterSupplyCondition}}}
{{#if photoUrls}}
- Photos: See attached photos for a better look!
{{/if}}

For Facebook posts:
- Use a slightly more descriptive and engaging tone.
- Include relevant hashtags.
- Encourage comments and shares.
- Call to action: "DM for details" or "Contact us!"

For WhatsApp posts:
- Be concise and use a friendly, conversational tone.
- Include relevant emojis.
- Use a clear call to action: "Message me for details!" or "Call now!"

Draft an engaging social media post based on these details, keeping the specified platform in mind.

Generated Post:
`,
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
