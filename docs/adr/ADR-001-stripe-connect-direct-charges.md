# ADR 001 - Direct charges for buyer payments on Connect accounts

Status: Accepted
Date: 2026-01-22

## Context
- PRD states non MoR
- Platform only bills SaaS subscription to creator
- Current Checkout uses destination charges and application fee
- This can be read as MoR like behavior

## Decision
- Buyer payments use direct charges on the creator Connect account
- Create Checkout Session with stripeAccount header
- Remove transfer_data and application_fee for buyer payments
- SaaS billing for creators stays on platform account in a separate flow

## Rationale
- Aligns with non-MoR posture for buyer payments
- Keeps funds, refunds, and disputes on the creator account

## Consequences
- Funds, refunds, disputes, receipts belong to creator account
- Platform keeps PaymentEvent logs and access grant or revoke
- Webhooks for buyer payments are Connect events and include event.account

## Out of scope
- No MoR changes
- No KYC for creators in MVP
- No platform fee on buyer payments
