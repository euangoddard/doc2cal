import { EnvGetter } from "@builder.io/qwik-city/middleware/request-handler";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
  Type,
} from "@google/genai";
import { type ExtractedEvents } from "~/types/events";

export async function extractEvents(
  file: File,
  timezone: string,
  env: EnvGetter,
): Promise<ExtractedEvents> {
  const ai = new GoogleGenAI({
    apiKey: env.get("GOOGLE_API_KEY")!,
  });
  const myfile = await ai.files.upload({
    file,
    config: { mimeType: file.type },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-05-20",
    contents: createUserContent([
      createPartFromUri(myfile.uri!, myfile.mimeType!),
      `Locate any events in the document and attempt to find the title, start, end, description, location. \`start\` and \`end\` should be in the ISO-8601 datetime format. All times should be assumed to be in the ${timezone} timezone.`,
    ]),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            start: {
              type: Type.STRING,
            },
            end: {
              type: Type.STRING,
            },
            title: {
              type: Type.STRING,
            },
            description: {
              type: Type.STRING,
            },
            location: {
              type: Type.STRING,
            },
          },
          propertyOrdering: [
            "title",
            "start",
            "end",
            "description",
            "location",
          ],
          required: ["title", "start", "end"],
        },
      },
    },
  });
  const events = response.text;
  return JSON.parse(events!) as ExtractedEvents;
}
