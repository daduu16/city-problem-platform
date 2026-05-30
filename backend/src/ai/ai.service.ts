import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsStreaming } from 'groq-sdk/resources/chat/completions';
import { AiPromptResponseDto } from './dto/ai-prompt-response.dto';
import { CreateAiPromptDto } from './dto/create-ai-prompt.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client?: Groq;
  private readonly model: string;
  private readonly visionModel: string;
  private readonly defaultSystemPrompt =
    'Sən Azərbaycan dilində cavab verən köməkçi asistentsən. İstifadəçi başqa dildə yazsa belə, cavabı Azərbaycan dilində ver. Cavabların aydın, praktik və qısa olsun.';

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    this.model = this.config.get<string>('GROQ_MODEL', 'openai/gpt-oss-120b');
    this.visionModel = this.config.get<string>(
      'GROQ_VISION_MODEL',
      'meta-llama/llama-4-scout-17b-16e-instruct',
    );

    if (apiKey) {
      this.client = new Groq({
        apiKey,
        timeout: 60_000,
      });
    }
  }

  async answerPrompt(
    dto: CreateAiPromptDto,
    image?: Express.Multer.File,
  ): Promise<AiPromptResponseDto> {
    if (!this.client) {
      throw new ServiceUnavailableException('GROQ_API_KEY is not configured on the backend.');
    }

    try {
      const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

      messages.push({
        role: 'system',
        content: dto.systemPrompt
          ? `${this.defaultSystemPrompt}\n\nƏlavə sistem təlimatı: ${dto.systemPrompt}`
          : this.defaultSystemPrompt,
      });

      const userContent: string | Groq.Chat.Completions.ChatCompletionContentPart[] =
        image
          ? [
              {
                type: 'text',
                text: dto.userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${image.mimetype};base64,${image.buffer.toString('base64')}`,
                  detail: 'auto',
                },
              },
            ]
          : dto.userPrompt;

      messages.push({
        role: 'user',
        content: userContent,
      });

      const selectedModel = image ? this.visionModel : this.model;
      const completionParams: ChatCompletionCreateParamsStreaming = {
        messages,
        model: selectedModel,
        temperature: 1,
        max_completion_tokens: 1000,
        top_p: 1,
        stream: true,
        stop: null,
      };

      if (!image) {
        completionParams.reasoning_effort = 'medium';
      }

      const chatCompletion = await this.client.chat.completions.create(completionParams);

      let answer = '';
      let completionId: string | undefined;

      for await (const chunk of chatCompletion) {
        completionId ??= chunk.id;
        answer += chunk.choices[0]?.delta?.content ?? '';
      }

      return {
        answer,
        model: selectedModel,
        completionId,
      };
    } catch (error) {
      if (error instanceof Groq.APIError) {
        this.logger.error(`Groq API error ${error.status}: ${error.message}`);
        throw new BadGatewayException('Groq API request failed. Check backend logs for details.');
      }

      this.logger.error(
        error instanceof Error ? error.message : 'Unknown Groq API error',
      );
      throw new BadGatewayException('Groq request failed. Check backend logs for details.');
    }
  }
}
