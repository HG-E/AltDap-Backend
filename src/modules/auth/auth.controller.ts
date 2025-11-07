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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() payload: SignupDto, @Headers('user-agent') userAgent?: string, @Ip() ipAddress?: string) {
    return this.authService.signup(payload, this.buildMetadata(userAgent, ipAddress));
  }

  @Post('login')
  login(@Body() payload: LoginDto, @Headers('user-agent') userAgent?: string, @Ip() ipAddress?: string) {
    return this.authService.login(payload, this.buildMetadata(userAgent, ipAddress));
  }

  @Post('refresh')
  refresh(@Body() payload: RefreshTokenDto, @Headers('user-agent') userAgent?: string, @Ip() ipAddress?: string) {
    return this.authService.refresh(payload, this.buildMetadata(userAgent, ipAddress));
  }

  @Post('logout')
  logout(@Body() payload: LogoutDto) {
    return this.authService.logout(payload);
  }

  @Post('password-reset/request')
  requestReset(@Body() payload: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(payload);
  }

  @Post('password-reset/confirm')
  confirmReset(@Body() payload: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(payload);
  }

  @Post('verify-email')
  verifyEmail(@Body() payload: VerifyEmailDto) {
    return this.authService.verifyEmail(payload);
  }

  @Post('guardian-consent')
  guardianConsent(@Body() payload: GuardianConsentDto) {
    return this.authService.guardianConsent(payload);
  }

  private buildMetadata(userAgent?: string, ipAddress?: string) {
    return { userAgent, ipAddress };
  }
}
