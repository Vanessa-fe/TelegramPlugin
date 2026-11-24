// brevo-sync.ts
const BREVO_API_URL = 'https://api.brevo.com/v3';

export const BREVO_LIST_IDS = {
  IMPAYE_EN_COURS: 7,
  GROUP_PUBLISHED: 8,
};

async function brevoRequest(path: string, method: string, body?: unknown) {
  const res = await fetch(`${BREVO_API_URL}${path}`, {
    method,
    headers: {
      'api-key': process.env.BREVO_API_KEY as string,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Brevo API error (${res.status}) sur ${method} ${path} : ${text}`,
    );
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

export async function upsertBrevoContact(
  email: string,
  options: { attributes?: Record<string, unknown>; listIds?: number[] },
) {
  return brevoRequest('/contacts', 'POST', {
    email,
    attributes: options.attributes,
    listIds: options.listIds,
    updateEnabled: true,
  });
}

export async function removeBrevoContactFromList(
  email: string,
  listId: number,
) {
  return brevoRequest(`/contacts/lists/${listId}/contacts/remove`, 'POST', {
    emails: [email],
  });
}

// Brevo caps list reads at 500 contacts per page, removals at 150 emails per call
const BREVO_LIST_PAGE_SIZE = 500;
const BREVO_LIST_REMOVE_BATCH_SIZE = 150;

/** Emails, lowercased, of every contact in a Brevo list. */
export async function getBrevoListEmails(listId: number): Promise<Set<string>> {
  const emails = new Set<string>();
  for (let offset = 0; ; offset += BREVO_LIST_PAGE_SIZE) {
    const page = (await brevoRequest(
      `/contacts/lists/${listId}/contacts?limit=${BREVO_LIST_PAGE_SIZE}&offset=${offset}`,
      'GET',
    )) as { contacts?: { email?: string }[] } | null;
    const contacts = page?.contacts ?? [];
    for (const contact of contacts) {
      if (contact.email) {
        emails.add(contact.email.toLowerCase());
      }
    }
    if (contacts.length < BREVO_LIST_PAGE_SIZE) {
      return emails;
    }
  }
}

/** Only pass emails already in the list: Brevo rejects the others. */
export async function removeBrevoContactsFromList(
  listId: number,
  emails: string[],
) {
  for (let i = 0; i < emails.length; i += BREVO_LIST_REMOVE_BATCH_SIZE) {
    await brevoRequest(`/contacts/lists/${listId}/contacts/remove`, 'POST', {
      emails: emails.slice(i, i + BREVO_LIST_REMOVE_BATCH_SIZE),
    });
  }
}
