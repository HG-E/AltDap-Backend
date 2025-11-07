import { Body, Controller, Get, Param, Post, Put, UnauthorizedException } from '@nestjs/common';
import { UpdateProfileDto, UpdateSettingsDto, UploadAvatarDto } from './dto/users.dto';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user?: AuthenticatedUser) {
    const currentUser = this.requireUser(user);
    return this.usersService.getMe(currentUser.id);
  }

  @Put('me')
  updateMe(@CurrentUser() user: AuthenticatedUser | undefined, @Body() payload: UpdateProfileDto) {
    const currentUser = this.requireUser(user);
    return this.usersService.updateMe(currentUser.id, payload);
  }

  @Post('me/avatar')
  uploadAvatar(@CurrentUser() user: AuthenticatedUser | undefined, @Body() payload: UploadAvatarDto) {
    const currentUser = this.requireUser(user);
    return this.usersService.requestAvatarUpload(currentUser.id, payload);
  }

  @Get('me/settings')
  getSettings(@CurrentUser() user: AuthenticatedUser | undefined) {
    const currentUser = this.requireUser(user);
    return this.usersService.getSettings(currentUser.id);
  }

  @Put('me/settings')
  updateSettings(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() payload: UpdateSettingsDto,
  ) {
    const currentUser = this.requireUser(user);
    return this.usersService.updateSettings(currentUser.id, payload);
  }

  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
