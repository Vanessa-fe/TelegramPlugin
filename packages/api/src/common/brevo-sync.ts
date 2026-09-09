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
