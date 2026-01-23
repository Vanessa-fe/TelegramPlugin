import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import {
  GrantAccessPayload,
  PaymentProvider,
  SubscriptionStatus,
  RevokeAccessPayload,
  queueNames,
  computeJobLatencyMs,
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
  expect(queueNames.grantAccessDlq).toBe("grant-access-dlq");
  expect(queueNames.revokeAccessDlq).toBe("revoke-access-dlq");

  const revokeParsed = RevokeAccessPayload.safeParse({
    subscriptionId: randomUUID(),
    reason: "refund",
  });

  if (!revokeParsed.success) {
    throw revokeParsed.error;
  }

  expect(revokeParsed.data.reason).toBe("refund");
});

test("computeJobLatencyMs returns latency when timestamps are present", () => {
  expect(computeJobLatencyMs(1000, 2500)).toBe(1500);
  expect(computeJobLatencyMs(1000, undefined, 4000)).toBe(3000);
  expect(computeJobLatencyMs(undefined, 2000)).toBeNull();
});
