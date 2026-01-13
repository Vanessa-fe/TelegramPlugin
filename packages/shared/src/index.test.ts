import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import {
  GrantAccessPayload,
  PaymentProvider,
  SubscriptionStatus,
  RevokeAccessPayload,
  queueNames,
} from "./index";

test("schemas se valident", () => {
  const parsed = GrantAccessPayload.safeParse({
    subscriptionId: randomUUID(),
    channelId: randomUUID(),
    customerId: randomUUID(),
    provider: PaymentProvider.Enum.stripe,
  });

  if (!parsed.success) {
    throw parsed.error;
  }

  expect(parsed.data.provider).toBe("stripe");
  expect(SubscriptionStatus.Enum.active).toBe("active");
  expect(queueNames.grantAccess).toBe("grant-access");

  const revokeParsed = RevokeAccessPayload.safeParse({
    subscriptionId: randomUUID(),
    reason: "refund",
  });

  if (!revokeParsed.success) {
    throw revokeParsed.error;
  }

  expect(revokeParsed.data.reason).toBe("refund");
});
