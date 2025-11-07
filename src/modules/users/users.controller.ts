import { Body, Controller, Get, Headers, Param, Post, Put, UnauthorizedException } from '@nestjs/common';
import { UpdateProfileDto, UpdateSettingsDto, UploadAvatarDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Headers('x-user-id') userId?: string) {
    return this.usersService.getMe(this.assertUserId(userId));
  }

  @Put('me')
  updateMe(@Headers('x-user-id') userId: string | undefined, @Body() payload: UpdateProfileDto) {
    return this.usersService.updateMe(this.assertUserId(userId), payload);
  }

  @Post('me/avatar')
  uploadAvatar(@Headers('x-user-id') userId: string | undefined, @Body() payload: UploadAvatarDto) {
    return this.usersService.requestAvatarUpload(this.assertUserId(userId), payload);
  }

  @Get('me/settings')
  getSettings(@Headers('x-user-id') userId: string | undefined) {
    return this.usersService.getSettings(this.assertUserId(userId));
  }

  @Put('me/settings')
  updateSettings(@Headers('x-user-id') userId: string | undefined, @Body() payload: UpdateSettingsDto) {
    return this.usersService.updateSettings(this.assertUserId(userId), payload);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  private assertUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }
    return userId;
  }
}
