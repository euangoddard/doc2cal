import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  routeAction$,
  z,
  zod$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { nanoid } from "nanoid";
import { extractEvents } from "~/helpers/extract";

interface Timezone {
  name: string;
  offsetHours: number;
  label: string;
}

export default component$(() => {
  const timezones: Timezone[] = (
    Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : []
  )
    .map((tz: string) => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
        hour: "2-digit",
      });
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find((p) => p.type === "timeZoneName");
      const offset = offsetPart?.value.replace("GMT", "UTC") || "";
      // Improved offsetHours calculation
      // offset is like "UTC+8:30" or "UTC-6:45"
      let offsetHours = 0;
      const match = offset.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
      if (match) {
        const sign = match[1] === "-" ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        offsetHours = sign * (hours + minutes / 60);
      }
      return {
        name: tz,
        offsetHours,
        label: `(${offset}) ${tz}`.replaceAll("_", " "),
      };
    })
    .sort((a, b) => {
      if (a.offsetHours !== b.offsetHours) {
        return a.offsetHours - b.offsetHours;
      }
      return a.name.localeCompare(b.name);
    });

  const fileInput = useSignal<HTMLInputElement | undefined>(undefined);
  const hasFile = useSignal(false);
  const extractEvents = useExtractEvents();
  const timezone = useSignal(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // The server's timezone might not be the same as the user's timezone,
    // so we update on the client side.
    timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  });

  return (
    <div class="flex h-full w-full flex-col items-center justify-center">
      <div class="hero bg-base-200 p-4">
        <div class="hero-content flex-col gap-8 lg:flex-row">
          <div class="text-center lg:text-left">
            <h1 class="mb-8 text-5xl font-bold">doc2cal</h1>
            <p class="mb-4">
              Convert your documents into calendar events with ease.
            </p>
            <p class="mb-4">
              Get started by adding your document and we'll extract the events!
            </p>
            <div>
              <div class="status status-info mr-2 animate-bounce" />
              Extracting might take some time depending on how complex your
              document is!
            </div>
          </div>
          <div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
            <div class="card-body">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Pick a file</legend>
                <input
                  type="file"
                  class="file-input"
                  ref={fileInput}
                  disabled={extractEvents.isRunning}
                  onChange$={(event) =>
                    (hasFile.value = !!(event.target as HTMLInputElement)
                      .files?.[0])
                  }
                />
                <label class="label">Max size 20MB</label>
              </fieldset>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Timezone</legend>
                <select
                  name="timezone"
                  class="select"
                  onChange$={(event) => {
                    const target = event.target as HTMLSelectElement;
                    timezone.value = target.value;
                  }}
                >
                  {timezones.map(({ name, label }) => (
                    <option
                      value={name}
                      key={name}
                      selected={name === timezone.value}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </fieldset>
              <button
                type="button"
                class="btn btn-primary mt-4"
                disabled={!hasFile.value || extractEvents.isRunning}
                onClick$={() => {
                  if (fileInput.value?.files?.[0]) {
                    const formData = new FormData();
                    formData.append("file", fileInput.value.files[0]);
                    formData.append("timezone", timezone.value);
                    extractEvents.submit(formData);
                  }
                }}
              >
                {extractEvents.isRunning ? (
                  <span class="loading loading-spinner loading-sm"></span>
                ) : (
                  <>Extract</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "doc2cal",
  meta: [
    {
      name: "description",
      content:
        "Extract events from your documents and add them to your calendar",
    },
  ],
};

export const useExtractEvents = routeAction$(
  async (formData, { fail, env, platform, redirect }) => {
    const file = formData["file"];
    if (!file || !(file instanceof File)) {
      return fail(400, {
        message: "Invalid file type. Please upload a valid file.",
      });
    }

    const events = await extractEvents(file, formData.timezone, env);

    const { EXTRACTED_EVENTS } = platform.env;
    const id = nanoid();
    await EXTRACTED_EVENTS.put(id, JSON.stringify(events), {
      expirationTtl: 7 * 60 * 60 * 24, // 7 days in seconds
    });

    throw redirect(308, `/events/${id}`);
  },
  zod$({
    file: z.any(),
    timezone: z.string(),
  }),
);
