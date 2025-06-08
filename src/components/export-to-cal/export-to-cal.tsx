import { component$ } from "@builder.io/qwik";
import { MatEditCalendarOutlined } from "@qwikest/icons/material";
import { google, ics, outlook } from "calendar-link";
import type { CalendarFormat } from "~/types/calendar-formats";
import type { ExtractedEvent } from "~/types/events";

export interface ExportToCalProps {
  event: ExtractedEvent;
  exportFormat: CalendarFormat;
}

export const ExportToCal = component$<ExportToCalProps>(
  ({ event, exportFormat }) => {
    return (
      <a
        {...getLinkProps(event, exportFormat)}
        class="btn btn-circle btn-ghost tooltip tooltip-left"
        data-tip="Add to calendar"
      >
        <MatEditCalendarOutlined style={{ width: "1.5em", height: "1.5em" }} />
      </a>
    );
  },
);

const getLinkProps = (
  event: ExtractedEvent,
  exportFormat: CalendarFormat,
): { href: string; download?: string; target?: string } => {
  switch (exportFormat) {
    case "google":
      return {
        href: google(event),
        target: "_blank",
      };
    case "outlook":
      return {
        href: outlook(event),
        target: "_blank",
      };
    default:
      return {
        href: ics(event),
        download: `${event.title}.ics`,
      };
  }
};
