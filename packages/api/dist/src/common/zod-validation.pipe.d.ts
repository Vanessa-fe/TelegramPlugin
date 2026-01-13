import { PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';
export declare class ZodValidationPipe<TOutput> implements PipeTransform<unknown, TOutput> {
    private readonly schema;
    constructor(schema: ZodSchema<TOutput>);
    transform(value: unknown): TOutput;
}
