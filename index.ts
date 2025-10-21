import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText, tool } from 'ai';
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    process.stdout.write('\nAssistant: ');
    
    let continueLoop = true;
    while (continueLoop) {
      const result = streamText({
        model: openai('gpt-4o'),
        messages,
        tools: {
          weather: tool({
            description: 'Get the weather in a location (fahrenheit)',
            inputSchema: z.object({
              location: z
                .string()
                .describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => {
              const temperature = Math.round(Math.random() * (90 - 32) + 32);
              return {
                location,
                temperature,
              };
            },
          }),
        },
      });
      
      for await (const delta of result.textStream) {
        process.stdout.write(delta);
      }

      // Wait for the full response and get all messages (tool calls + results)
      const response = await result.response;
      messages.push(...response.messages);
      
      // Check if the last message has tool calls - if so, continue the loop
      const lastMessage = response.messages[response.messages.length - 1];
      continueLoop = lastMessage.role === 'tool';
    }
    
    process.stdout.write('\n\n');
  }
}

main().catch(console.error);