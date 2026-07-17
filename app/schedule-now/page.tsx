import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Your Phone Consultation",
  description:
    "Schedule your free 20-minute phone consultation with Growth Journey Therapy. Pick a date and time that works for you.",
  alternates: { canonical: "/schedule-now" },
};

// Reproduces the original /schedule-now/ page 1:1: heading, instructions, and the
// practice's Google Calendar appointment-scheduling embed (their booking system).
const BOOKING_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0QXU_kRuxX8KQ7u8tTcY7wOIB6aJQa1OihxSQD2ZzPVmQAt7RB0lqj5CuGii19M6vyILLpHfMm?gv=true";

export default function ScheduleNowPage() {
  return (
    <>
      <section className="bg-paper pt-12 md:pt-16">
        <div className="container-page text-center">
          <h1 className="text-3xl md:text-4xl">Request Your Phone Consultation</h1>
          <p className="mx-auto mt-6 max-w-prose text-lg text-ink-soft">
            Please select a date and time for your phone consultation. Check your email for a
            confirmation or a new proposed time.
            <br />
            <span className="text-base">*check your spam folder</span>
          </p>
        </div>
      </section>
      <section className="bg-paper py-10 md:py-12">
        <div className="container-page">
          <iframe
            src={BOOKING_URL}
            title="Schedule your phone consultation — Growth Journey Therapy"
            className="h-[600px] w-full rounded-lg border-0 md:h-[640px]"
            loading="eager"
          />
        </div>
      </section>
    </>
  );
}
