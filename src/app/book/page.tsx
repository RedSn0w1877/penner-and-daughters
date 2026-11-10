// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking/booking-flow";
import { Booking } from "@/components/sections/booking";

export const metadata: Metadata = {
  title: "Book a time",
  description: "Four short steps. No account, no VIN. You'll see the price before you confirm.",
};

/**
 * /book/: the appointment book on its own page (header Book buttons point here from every page
 * but the home page). The flow renders with the page, so a total carried from the home page's
 * estimate can morph straight into it.
 */
export default function BookPage() {
  return (
    <Booking variant="page">
      <BookingFlow variant="page" />
    </Booking>
  );
}
