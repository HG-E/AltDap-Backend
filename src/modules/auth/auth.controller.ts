import { Body, Controller, Headers, Ip, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GuardianConsentDto,
  LoginDto,
  LogoutDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RefreshTokenDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() payload: SignupDto, @Headers('user-agent') userAgent?: string, @Ip() ipAddress?: string) {
    return this.authService.signup(payload, this.buildMetadata(userAgent, ipAddress));
  }

  @Public()
  @Post('login')
  login(@Body() payload: LoginDto, @Headers('user-agent') userAgent?: string, @Ip() ipAddress?: string) {
    return this.authService.login(payload, this.buildMetadata(userAgent, ipAddress));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() payload: RefreshTokenDto, @Headers('user-agent') userAgent?: string, @Ip() ipAddress?: string) {
    return this.authService.refresh(payload, this.buildMetadata(userAgent, ipAddress));
  }

  @Public()
  @Post('logout')
  logout(@Body() payload: LogoutDto) {
    return this.authService.logout(payload);
  }

  @Public()
  @Post('password-reset/request')
  requestReset(@Body() payload: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(payload);
  }

  @Public()
  @Post('password-reset/confirm')
  confirmReset(@Body() payload: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(payload);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() payload: VerifyEmailDto) {
    return this.authService.verifyEmail(payload);
  }

  @Public()
  @Post('guardian-consent')
  guardianConsent(@Body() payload: GuardianConsentDto) {
    return this.authService.guardianConsent(payload);
  }

  private buildMetadata(userAgent?: string, ipAddress?: string) {
    return { userAgent, ipAddress };
  }
}
