import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export interface GoogleProfile {
  provider: 'google';
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
      // This API does not use Passport session storage. Enabling OAuth state
      // without a custom store makes passport-google-oauth20 fail at runtime
      // before the redirect to Google.
      state: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleProfile {
    const { id, emails, name } = profile;

    const googleProfile: GoogleProfile = {
      provider: 'google',
      providerId: id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName,
      lastName: name?.familyName,
    };

    return googleProfile;
  }
}
