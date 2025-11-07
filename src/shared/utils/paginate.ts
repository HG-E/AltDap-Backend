import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

export const paginate = <T>(items: T[], total: number, query: PaginationQueryDto): PaginatedResult<T> => ({
  data: items,
  total,
  page: query.page ?? 1,
  limit: query.limit ?? 20,
});