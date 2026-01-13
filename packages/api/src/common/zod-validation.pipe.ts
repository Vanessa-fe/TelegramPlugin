import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { SafeParseReturnType, ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe<TOutput>
  implements PipeTransform<unknown, TOutput>
{
  constructor(private readonly schema: ZodSchema<TOutput>) {}

  transform(value: unknown): TOutput {
    const parsed: SafeParseReturnType<unknown, TOutput> =
      this.schema.safeParse(value);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return parsed.data;
  }
}
