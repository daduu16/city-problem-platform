import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CreateMobileProblemDto } from './dto/create-mobile-problem.dto';
import {
  ForgotPasswordDto,
  MobileLoginDto,
  ResendCodeDto,
  VerifyEmailDto,
} from './dto/mobile-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { MobileApiService } from './mobile-api.service';

@ApiTags('mobile-api')
@Controller('api')
export class MobileApiController {
  constructor(private mobileApi: MobileApiService) {}

  @Post('auth/register')
  register(@Body() dto: RegisterDto) {
    return this.mobileApi.register(dto);
  }

  @Post('auth/login')
  login(@Body() dto: MobileLoginDto) {
    return this.mobileApi.login(dto);
  }

  @Post('auth/verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.mobileApi.verifyEmail(dto);
  }

  @Post('auth/resend-code')
  resendCode(@Body() dto: ResendCodeDto) {
    return this.mobileApi.resendCode(dto);
  }

  @Post('auth/forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.mobileApi.forgotPassword(dto);
  }

  @Get('news')
  findNews() {
    return this.mobileApi.findNews();
  }

  @Get('notifications')
  findNotifications() {
    return this.mobileApi.findNotifications();
  }

  @Get('problems')
  findProblems() {
    return this.mobileApi.findProblems();
  }

  @Post('problems')
  createProblem(@Body() dto: CreateMobileProblemDto) {
    return this.mobileApi.createProblem(dto);
  }

  @Post('uploads/mobile-media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  uploadMobileMedia(
    @UploadedFile() file?: Express.Multer.File,
    @Body('mediaType') mediaType?: 'image' | 'video',
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.mobileApi.uploadMobileMedia(file, mediaType);
  }
}
