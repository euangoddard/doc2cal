import { component$ } from "@builder.io/qwik";
import {
  type DocumentHead,
  Link,
  routeLoader$,
  useLocation,
  useNavigate,
} from "@builder.io/qwik-city";
import type { ExtractedEvent, ExtractedEvents } from "~/types/events";
import { DayEvents } from "~/components/day-events/day-events";
import type { CalendarFormat } from "~/types/calendar-formats";

function getLocalDateKey(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is zero-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function groupEventsByDate(
  events: ExtractedEvents,
): Record<string, ExtractedEvents> {
  return events.reduce<Record<string, ExtractedEvent[]>>((acc, event) => {
    const dateKey = getLocalDateKey(event.start);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});
}

const calendarFormats: readonly { key: CalendarFormat; label: string }[] = [
  { key: "google", label: "Google" },
  { key: "outlook", label: "Outlook" },
  { key: "apple", label: "Apple" },
  { key: "generic", label: "Generic" },
];

export default component$(() => {
  const events = useExtractEvents();
  const locale = useLocale();
  const calendarFormat = useCalendarFormat();
  const navigate = useNavigate();
  const loc = useLocation();

  const groupedEvents = groupEventsByDate(events.value);

  return (
    <div>
      <h1 class="my-8 text-3xl">
        Found {events.value.length} events in your document
      </h1>

      <div class="mb-4 flex flex-col items-center gap-2 md:flex-row">
        <span class="text-sm font-medium">Calendar format:</span>
        <div class="join join-horizontal">
          {calendarFormats.map((format) => (
            <button
              key={format.key}
              class={[
                "btn btn-sm join-item",
                { "btn-secondary": calendarFormat.value === format.key },
              ]}
              onClick$={async () => {
                const url = new URL(loc.url);
                url.searchParams.set("format", format.key);
                await navigate(url);
              }}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>

      <div class="divider" />

      <div class="mx-auto mb-4 grid max-w-lg grid-cols-[48px_1fr] gap-4">
        {Object.entries(groupedEvents).map(([key, events]) => (
          <DayEvents
            key={key}
            events={events}
            locale={locale.value}
            exportFormat={calendarFormat.value as any}
          />
        ))}
      </div>

      <div class="mx-auto max-w-lg pb-8">
        <Link href="/" class="btn btn-primary btn-block">
          Extract from another document
        </Link>
      </div>
    </div>
  );
});

export const useExtractEvents = routeLoader$(
  async ({ platform, params, redirect }) => {
    const { EXTRACTED_EVENTS } = platform.env;
    const events = await EXTRACTED_EVENTS.get(params.id, { type: "json" });
    if (!events) {
      throw redirect(308, "/");
    }
    return events as ExtractedEvents;
  },
);

export const useLocale = routeLoader$(({ headers }) => {
  const acceptLanguage = headers.get("accept-language");
  if (!acceptLanguage) {
    return "en-GB";
  }
  const languages = acceptLanguage.split(",").map((lang) => lang.split(";")[0]);
  return languages[0]; // Return the first language in the list
});

export const useCalendarFormat = routeLoader$<CalendarFormat>(({ query }) => {
  const format = query.get("format");
  if (!format) {
    return calendarFormats[0].key;
  }
  const validFormats = calendarFormats.map((f) => f.key);
  return (
    validFormats.includes(format as any) ? format : calendarFormats[0].key
  ) as CalendarFormat;
});

export const head: DocumentHead = ({ resolveValue }) => {
  const events = resolveValue(useExtractEvents);
  return {
    title: "doc2cal :: events",
    meta: [
      {
        name: "description",
        content: `Found ${events.length} events`,
      },
    ],
  };
};
