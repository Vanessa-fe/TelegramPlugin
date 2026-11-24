import { Logger } from '@nestjs/common';
import {
  getBrevoListEmails,
  removeBrevoContactsFromList,
  upsertBrevoContact,
} from '../../common/brevo-sync';
import {
  creatorStage,
  type EngagementCreator,
  parseEmailList,
  parseListId,
  syncCreatorEngagementToBrevo,
} from './creator-engagement';

jest.mock('../../common/brevo-sync', () => ({
  getBrevoListEmails: jest.fn(),
  removeBrevoContactsFromList: jest.fn(),
  upsertBrevoContact: jest.fn(),
}));

const getListEmails = jest.mocked(getBrevoListEmails);
const removeFromList = jest.mocked(removeBrevoContactsFromList);
const upsertContact = jest.mocked(upsertBrevoContact);

const LIST_ID = 42;
const LAST_LOGIN = new Date('2026-10-10T08:30:00Z');

/** Ready to sell, never sold, 45 days without logging in */
function creator(
  overrides: Partial<Omit<EngagementCreator, 'healthScore'>> & {
    daysSinceLogin?: number | null;
    recentSalesCount?: number;
  } = {},
): EngagementCreator {
  const { daysSinceLogin = 45, recentSalesCount = 0, ...fields } = overrides;
  return {
    id: 'org-1',
    billingEmail: 'creator@example.com',
    suspendedAt: null,
    platformStatus: 'ACTIVE',
    sellingBlockers: [],
    channelsCount: 1,
    salesCount: 0,
    healthScore: {
      level: 'red',
      score: 38,
      factors: {
        loginRecency: 'red',
        activityLevel: 'red',
        paymentStatus: 'green',
        revenueHealth: 'green',
      },
      lastLoginAt: daysSinceLogin === null ? null : LAST_LOGIN,
      daysSinceLogin,
      recentSalesCount,
      recentRevenueChange: null,
    },
    ...fields,
  };
}

describe('creatorStage', () => {
  it.each([
    [
      'suspendu',
      creator({ suspendedAt: new Date(), platformStatus: null }),
      true,
    ],
    [
      'sans_plan',
      creator({ platformStatus: null, sellingBlockers: ['PLATFORM_PLAN'] }),
      true,
    ],
    [
      'plan_inactif',
      creator({
        platformStatus: 'CANCELED',
        sellingBlockers: ['PLATFORM_PLAN'],
      }),
      true,
    ],
    [
      'canal',
      creator({ channelsCount: 0, sellingBlockers: ['STRIPE_NOT_CONNECTED'] }),
      false,
    ],
    ['stripe', creator({ sellingBlockers: ['STRIPE_NOT_CONNECTED'] }), false],
    ['stripe', creator({ sellingBlockers: ['STRIPE_INCOMPLETE'] }), false],
    ['offre', creator(), false],
    ['promo', creator(), true],
    ['en_pause', creator({ salesCount: 12, recentSalesCount: 0 }), true],
    ['actif', creator({ salesCount: 12, recentSalesCount: 3 }), true],
  ])('returns %s', (expected, input, hasReadyOffer) => {
    expect(creatorStage(input, hasReadyOffer)).toBe(expected);
  });
});

describe('parseEmailList', () => {
  it('splits on commas, semicolons and spaces, lowercased', () => {
    expect(parseEmailList(' A@x.com, b@x.com;c@x.com \n d@x.com ')).toEqual(
      new Set(['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com']),
    );
  });

  it('returns an empty set when unset', () => {
    expect(parseEmailList(undefined).size).toBe(0);
  });
});

describe('parseListId', () => {
  it.each([
    ['12', 12],
    [' 7 ', 7],
    [undefined, null],
    ['', null],
    ['0', null],
    ['abc', null],
    ['3.5', null],
  ])('parses %p as %p', (value, expected) => {
    expect(parseListId(value)).toBe(expected);
  });
});

describe('syncCreatorEngagementToBrevo', () => {
  const logger = new Logger('test');

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    getListEmails.mockResolvedValue(new Set());
    removeFromList.mockResolvedValue(undefined);
    upsertContact.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function sync(
    creators: EngagementCreator[],
    options: {
      readyOrganizationIds?: string[];
      inactiveListId?: number | null;
      excludedEmails?: string[];
    } = {},
  ) {
    return syncCreatorEngagementToBrevo({
      creators,
      readyOrganizationIds: new Set(options.readyOrganizationIds ?? ['org-1']),
      inactiveListId:
        options.inactiveListId === undefined ? LIST_ID : options.inactiveListId,
      excludedEmails: new Set(options.excludedEmails ?? []),
      logger,
    });
  }

  it('sends the attributes and adds an inactive creator to the list', async () => {
    const result = await sync([creator()]);

    expect(upsertContact).toHaveBeenCalledWith('creator@example.com', {
      attributes: {
        ETAPE: 'promo',
        DERNIERE_CONNEXION: '2026-10-10',
        NB_VENTES: 0,
      },
      listIds: [LIST_ID],
    });
    expect(removeFromList).not.toHaveBeenCalled();
    expect(result).toEqual({
      synced: 1,
      failed: 0,
      addedToInactiveList: 1,
      removedFromInactiveList: 0,
      inactiveListSynced: true,
    });
  });

  it('does not add again a creator already in the list', async () => {
    getListEmails.mockResolvedValue(new Set(['creator@example.com']));

    const result = await sync([
      creator({ billingEmail: 'Creator@Example.com' }),
    ]);

    expect(upsertContact).toHaveBeenCalledWith(
      'creator@example.com',
      expect.objectContaining({ listIds: undefined }),
    );
    expect(removeFromList).not.toHaveBeenCalled();
    expect(result.addedToInactiveList).toBe(0);
  });

  it.each([
    ['recently logged in', creator({ daysSinceLogin: 29 })],
    ['still selling', creator({ salesCount: 4, recentSalesCount: 1 })],
    ['suspended', creator({ suspendedAt: new Date() })],
  ])('keeps a creator %s out of the list', async (_label, input) => {
    await sync([input]);

    expect(upsertContact).toHaveBeenCalledWith(
      'creator@example.com',
      expect.objectContaining({ listIds: undefined }),
    );
  });

  it('removes returning and excluded creators, not contacts added by hand', async () => {
    getListEmails.mockResolvedValue(
      new Set(['back@example.com', 'me@example.com', 'manual@example.com']),
    );

    const result = await sync(
      [
        creator({
          id: 'org-1',
          billingEmail: 'back@example.com',
          daysSinceLogin: 2,
        }),
        creator({ id: 'org-2', billingEmail: 'me@example.com' }),
      ],
      { excludedEmails: ['me@example.com'] },
    );

    expect(removeFromList).toHaveBeenCalledWith(LIST_ID, [
      'back@example.com',
      'me@example.com',
    ]);
    expect(upsertContact).toHaveBeenCalledTimes(1);
    expect(upsertContact).toHaveBeenCalledWith(
      'back@example.com',
      expect.anything(),
    );
    expect(result.removedFromInactiveList).toBe(2);
  });

  it('leaves out creators who never logged in', async () => {
    const result = await sync([creator({ daysSinceLogin: null })]);

    expect(upsertContact).not.toHaveBeenCalled();
    expect(result.synced).toBe(0);
  });

  it('still sends the attributes when the list cannot be read', async () => {
    getListEmails.mockRejectedValue(new Error('Brevo down'));

    const result = await sync([creator()]);

    expect(upsertContact).toHaveBeenCalledWith(
      'creator@example.com',
      expect.objectContaining({ listIds: undefined }),
    );
    expect(removeFromList).not.toHaveBeenCalled();
    expect(result.inactiveListSynced).toBe(false);
  });

  it('only sends the attributes without a list id', async () => {
    const result = await sync([creator()], { inactiveListId: null });

    expect(getListEmails).not.toHaveBeenCalled();
    expect(upsertContact).toHaveBeenCalledWith(
      'creator@example.com',
      expect.objectContaining({ listIds: undefined }),
    );
    expect(result.inactiveListSynced).toBe(false);
  });

  it('keeps going when one creator fails', async () => {
    upsertContact.mockRejectedValueOnce(new Error('invalid email'));

    const result = await sync([
      creator({ id: 'org-1', billingEmail: 'broken@example.com' }),
      creator({ id: 'org-2', billingEmail: 'fine@example.com' }),
    ]);

    expect(upsertContact).toHaveBeenCalledTimes(2);
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.addedToInactiveList).toBe(1);
  });
});
