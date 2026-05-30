import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadGatewayResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AiPromptResponseDto } from './dto/ai-prompt-response.dto';
import { CreateAiPromptDto } from './dto/create-ai-prompt.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('prompt')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 4 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({ summary: 'Send system and user prompts to Groq and return the generated answer.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userPrompt'],
      properties: {
        systemPrompt: {
          type: 'string',
          example: 'You are a helpful assistant for a municipal incident platform.',
        },
        userPrompt: {
          type: 'string',
          example: 'Describe this image and explain what municipal issue it shows.',
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Optional image file. Max size: 4 MB.',
        },
      },
    },
  })
  @ApiOkResponse({ type: AiPromptResponseDto })
  @ApiServiceUnavailableResponse({ description: 'Groq API key is missing on the backend.' })
  @ApiBadGatewayResponse({ description: 'Groq API request failed.' })
  answerPrompt(
    @Body() dto: CreateAiPromptDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    if (image && !image.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are supported.');
    }

    return this.aiService.answerPrompt(dto, image);
  }
}
