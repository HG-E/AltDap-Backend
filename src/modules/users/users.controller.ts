import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UpdateProfileDto, UpdateSettingsDto, UploadAvatarDto } from './dto/users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe() {
    return this.usersService.getMe();
  }

  @Put('me')
  updateMe(@Body() payload: UpdateProfileDto) {
    return this.usersService.updateMe(payload);
  }

  @Post('me/avatar')
  uploadAvatar(@Body() payload: UploadAvatarDto) {
    return this.usersService.requestAvatarUpload(payload);
  }

  @Get('me/settings')
  getSettings() {
    return this.usersService.getSettings();
  }

  @Put('me/settings')
  updateSettings(@Body() payload: UpdateSettingsDto) {
    return this.usersService.updateSettings(payload);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
