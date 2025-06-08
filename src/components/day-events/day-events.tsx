import { component$ } from "@builder.io/qwik";
import { ExtractedEvents } from "~/types/events";
import { EventCard } from "../event/event";

export interface DayEventsProps {
  events: ExtractedEvents;
  locale: string;
  exportFormat: "google" | "outlook" | "apple" | "generic";
}

export const DayEvents = component$<DayEventsProps>(
  ({ events, locale, exportFormat }) => {
    const eventCount = events.length;
    const startDate = new Date(events[0].start);
    return (
      <>
        <time
          dateTime={startDate.toISOString()}
          class="row-span-(--event-count) text-center"
          style={{
            "--event-count": eventCount,
          }}
        >
          <div class="text-xs font-medium">
            {startDate.toLocaleString(locale, { weekday: "short" })}
          </div>
          <div class="text-md font-medium">{startDate.getDate()}</div>
          <div class="text-xs font-medium">
            {startDate.toLocaleString(locale, { month: "short" })}
          </div>
        </time>
        {events.map((event, index) => (
          <EventCard
            key={index}
            event={event}
            locale={locale}
            exportFormat={exportFormat}
          />
        ))}
        <div class="divider col-span-2 my-0" />
      </>
    );
  },
);
