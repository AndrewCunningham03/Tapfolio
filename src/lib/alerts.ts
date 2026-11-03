import "server-only";
import { addressLines } from "./address";
import { ownerEmail, sendEmail } from "./email";
import { formatPrice } from "./site";
import type { CardOrder } from "./orders";

/** Tell the owner a new paid order is waiting for a card. */
export async function alertNewOrder(order: CardOrder) {
  const to = ownerEmail();
  if (!to) return;
  const paid = formatPrice(Number(order.card_price), order.currency);
  const lines = [
    `New paid Tapfolio order: ${paid} taken, then ${formatPrice(Number(order.monthly_price), order.currency)} a month.`,
    "",
    `Name:  ${order.name}`,
    `Email: ${order.email}`,
    order.phone ? `Phone: ${order.phone}` : null,
    "",
    "Post the card to:",
    ...addressLines(order).map((l) => "  " + l),
    "",
    "To fulfil it: scan an unused card with your phone camera while signed in as admin, press Assign, then post it.",
    "Orders: https://tapfolio.co.uk/admin",
  ];
  await sendEmail({
    to,
    subject: `New Tapfolio order: ${order.name} (${order.country})`,
    text: lines.filter((l): l is string => l !== null).join("\n"),
  });
}
