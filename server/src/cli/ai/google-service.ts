import {google} from "@ai-sdk/google";
import {streamText, generateObject} from "ai";
import {config} from "../../config/google.config.js";
import chalk from "chalk";
import type {z} from "zod";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export class AIService {
    model: ReturnType<typeof google>;
    
    constructor() {
        if(!config.googleApikey){
            throw new Error(chalk.red("Google API key is not set"));
        }

        // Set the API key as environment variable for @ai-sdk/google
        const apiKey= config.googleApikey;
        
        this.model = google(config.model);
    }

    /**
   * Send a message and get streaming response
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Function} onChunk - Callback for each text chunk
   * @param {Object} tools - Optional tools object
   * @param {Function} onToolCall - Callback for tool calls
   * @returns {Promise<Object>} Full response with content, tool calls, and usage
   */
  async sendMessage(messages: Message[], onChunk?: (chunk: string) => void, tools?: unknown, onToolCall?: unknown) {
    try {
      const streamConfig = {
        model: this.model,
        messages: messages,
        
      };


      const result = streamText(streamConfig);
      
      let fullResponse = "";
      
      // Stream text chunks
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }

      const fullResult =  result;

      return {
        content: fullResponse,
        finishReason: fullResult.finishReason,
        usage: fullResult.usage,
        steps: fullResult.steps,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red("AI Service Error:"), errorMessage);
      console.error(chalk.red("Full error:"), error);
      throw error;
    }
  }

  /**
   * Get a non-streaming response
   * @param {Array} messages - Array of message objects
   * @param {Object} tools - Optional tools
   * @returns {Promise<string>} Response text
   */
  async getMessage(messages: Message[], tools?: unknown) {
    let fullResponse = "";
    const result = await this.sendMessage(messages, (chunk: string) => {
      fullResponse += chunk;
    }, tools);
    return result.content;
  }

  /**
   * Generate structured output using a Zod schema
   * @param {Object} schema - Zod schema
   * @param {string} prompt - Prompt for generation
   * @returns {Promise<Object>} Parsed object matching the schema
   */
  async generateStructured(schema: z.ZodType, prompt: string) {
    try {
      const result = await generateObject({
        model: this.model,
        schema: schema,
        prompt: prompt,
      });
      
      return result.object;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red("AI Structured Generation Error:"), errorMessage);
      throw error;
    }
  }
}