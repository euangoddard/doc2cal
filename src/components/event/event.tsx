import { component$ } from "@builder.io/qwik";
import { ExtractedEvent } from "~/types/events";
import {
  MatDescriptionOutlined,
  MatLocationOnOutlined,
} from "@qwikest/icons/material";
import { ExportToCal } from "../export-to-cal/export-to-cal";
import { CalendarFormat } from "~/types/calendar-formats";

export interface EventProps {
  event: ExtractedEvent;
  locale: string;
  exportFormat: CalendarFormat;
}

export const EventCard = component$<EventProps>(
  ({ event, locale, exportFormat }) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // forces 24-hour format
    };
    const startTime = startDate.toLocaleTimeString(locale, timeOptions);
    const endTime = endDate.toLocaleTimeString(locale, timeOptions);
    const isSameTime = startDate.getTime() === endDate.getTime();
    return (
      <div class="bg-accent flex rounded-lg p-2 pl-4 shadow-md">
        <div class="grow">
          <h3 class="text-md font-medium">{event.title}</h3>
          <p class="text-xs">
            {isSameTime ? startTime : `${startTime}–${endTime}`}
          </p>
          {event.location && (
            <p class="flex items-center gap-1 text-xs">
              <MatLocationOnOutlined /> {event.location}
            </p>
          )}

          {event.description && (
            <p class="flex items-center gap-1 text-xs">
              <MatDescriptionOutlined /> {event.description}
            </p>
          )}
        </div>

        <ExportToCal exportFormat={exportFormat} event={event} />
      </div>
    );
  },
);
