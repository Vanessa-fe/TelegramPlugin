import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { assertTelegramBotSecret, ZodValidationPipe } from '../../common';
import { Public } from '../auth/decorators/public.decorator';
import { ChannelAccessService } from './channel-access.service';

const linkTelegramAccountSchema = z.object({
  telegramUserId: z
    .union([z.string(), z.number()])
    .transform((value) => String(value).trim())
    .refine((value) => /^\d+$/.test(value), {
      message: 'telegramUserId invalide',
    }),
  telegramUsername: z.string().max(64).optional(),
  linkToken: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,64}$/)
    .optional(),
});

type LinkTelegramAccountDto = z.infer<typeof linkTelegramAccountSchema>;

const recordInviteJoinSchema = z.object({
  chatId: z.string().regex(/^-?\d+$/),
  inviteLink: z.string().url().max(256),
  telegramUserId: z.string().regex(/^\d+$/),
  telegramUsername: z.string().max(64).optional(),
});

type RecordInviteJoinDto = z.infer<typeof recordInviteJoinSchema>;

/** Endpoints called by the Telegram bot (authenticated by shared secret). */
@Controller('access/telegram')
export class TelegramLinkController {
  constructor(
    private readonly channelAccessService: ChannelAccessService,
    private readonly config: ConfigService,
  ) {}

  @Post('link')
  @Public()
  linkAccount(
    @Headers('x-telegram-stars-secret') secret: string | undefined,
    @Body(new ZodValidationPipe(linkTelegramAccountSchema))
    body: LinkTelegramAccountDto,
  ) {
    assertTelegramBotSecret(this.config, secret);

    return this.channelAccessService.linkTelegramAccount(
      body.telegramUserId,
      body.telegramUsername,
      body.linkToken,
    );
  }

  @Post('joined')
  @Public()
  recordJoin(
    @Headers('x-telegram-stars-secret') secret: string | undefined,
    @Body(new ZodValidationPipe(recordInviteJoinSchema))
    body: RecordInviteJoinDto,
  ) {
    assertTelegramBotSecret(this.config, secret);

    return this.channelAccessService.recordInviteJoin(body);
  }
}
