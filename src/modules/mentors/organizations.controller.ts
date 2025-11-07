import { Controller, Get, Param } from '@nestjs/common';
import { MentorsService } from './mentors.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  list() {
    return this.mentorsService.listOrganizations();
  }

  @Get(':orgId')
  detail(@Param('orgId') orgId: string) {
    return this.mentorsService.getOrganization(orgId);
  }
}