import { IsInt, IsOptional, IsPositive, Max } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number = 20;
}