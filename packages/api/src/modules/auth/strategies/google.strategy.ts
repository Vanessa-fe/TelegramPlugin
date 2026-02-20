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
      // Enable state parameter to protect against OAuth CSRF attacks
      state: true,
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
