
'use server';

import { z } from "zod";
import { TimetableEntry, Conflict } from "@/lib/types";
import { generateTimetable, GenerateTimetableInput } from "@/lib/timetable/generate-timetable";
import { suggestFaculty, SuggestFacultyInput } from "@/lib/timetable/suggest-faculty";
import { runChat, ChatAssistantInput } from "@/ai/flows/chat-assistant";


export async function runGenerateTimetable(input: GenerateTimetableInput) {
  try {
    // The generateTimetable flow now handles both generation and reporting in a single call.
    const generationResult = await generateTimetable(input);

    // If the entire generationResult object is missing, it's a hard failure.
    if (!generationResult) {
      return { success: false, error: "AI model failed to return a valid response object." };
    }
    
    // If the timetable array is missing or empty, it signifies a soft failure where the AI explained the reason in the report.
    if (!generationResult.timetable || generationResult.timetable.length === 0) {
      return { success: false, error: generationResult.report || "AI failed to generate a schedule. The returned timetable was empty and no report was provided." };
    }
    
    // If successful, the result contains the timetable, conflicts, and report.
    return { success: true, data: generationResult };

  } catch (error) {
    console.error("Detailed error in runGenerateTimetable:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: `AI Generation Failed: ${errorMessage}` };
  }
}

export async function runSuggestFaculty(input: SuggestFacultyInput) {
    try {
        const result = await suggestFaculty(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Detailed error in runSuggestFaculty:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `AI Suggestion Failed: ${errorMessage}` };
    }
}

export async function runChatAssistant(input: ChatAssistantInput) {
    try {
        const result = await runChat(input);
        return { success: true, data: result };
    } catch (error) {
        console.error("Detailed error in runChatAssistant:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: `Chat Assistant Failed: ${errorMessage}` };
    }
}
