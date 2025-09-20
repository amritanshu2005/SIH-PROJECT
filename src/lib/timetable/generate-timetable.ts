
'use server';

/**
 * @fileOverview Generates an optimized timetable using an intelligent algorithm based on imported data and defined constraints.
 *
 * - generateTimetable - A function that generates an optimized timetable and an analysis report in a single call.
 * - GenerateTimetableInput - The input type for the generateTimetable function.
 * - GenerateTimetableOutput - The return type for the generateTimetable function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateTimetableOutputSchema, GenerateTimetableInputSchema } from '@/lib/timetable/schemas';


export type GenerateTimetableInput = z.infer<typeof GenerateTimetableInputSchema>;
export type GenerateTimetableOutput = z.infer<typeof GenerateTimetableOutputSchema>;

const generationPrompt = ai.definePrompt({
  name: 'timetableGenerationPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: GenerateTimetableInputSchema },
  output: { schema: GenerateTimetableOutputSchema },
  prompt: `You are a master scheduler AI. Your task is to generate a conflict-free, 6-day (Monday to Saturday) weekly academic timetable and then immediately write a detailed analysis report on the schedule you just created.

You will be given the following data as JSON strings:
- Student Data: {{studentData}}
- Faculty Data: {{facultyData}}
- Course Data: {{courseData}}
- Room Data: {{roomData}}
- Scheduling Constraints: {{constraints}}

The timetable runs for 7 time slots per day: "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 01:00", "02:00 - 03:00", "03:00 - 04:00", and "04:00 - 05:00".

**Your Task is a two-step process:**

**Step 1: Generate the Timetable**
Adhere to these rules with absolute precision:
1.  **No Double Bookings (Highest Priority):** A faculty member, a student (based on their enrolled courses), or a room cannot be in two places at once.
2.  **Constraint Adherence:** Strictly enforce faculty availability, room capacity, course requirements (e.g., labs), and any program-specific time blocks (like internships or teaching practice).
3.  **Create a Dense Schedule:** Your goal is to create a highly utilized and efficient schedule. Fill as many slots as possible. An empty timetable is a failure.
4.  **Conflict Logging:** If a conflict is unavoidable, schedule one class and log the other in the \`conflicts\` array. Do not simply leave a slot empty if a conflict is the reason.
5.  **Include Saturday:** The schedule must cover all 6 days from Monday to Saturday.

**Step 2: Generate the Analysis Report**
After generating the timetable, immediately write a detailed analysis report in the \`report\` field of the JSON output. This report MUST include:
1.  **Constraint Adherence Verification:** Explicitly confirm how you followed key constraints (e.g., "Constraint Adhered To: Dr. Sunita Reddy's availability was respected; no classes were assigned on her specified off-day.").
2.  **Faculty Workload Analysis:** Provide a quantitative breakdown of hours assigned to several key faculty members vs. their expected workload.
3.  **Resource Utilization Analysis:** Calculate and state the overall room utilization percentage and identify peak/off-peak hours.
4.  **Actionable Recommendations:** Provide specific suggestions for improvement (e.g., "Recommendation: To balance faculty load, consider reassigning one of Dr. Iyer's sections to Dr. Kumar, who has a lighter workload.").

**Fallback Protocol:**
If you encounter a fundamental contradiction in the data that makes schedule generation impossible, you MUST return an empty \`timetable\` array and use the \`report\` field to explain the exact reason for the failure (e.g., "Generation failed because Dr. Smith is the only faculty for a required course but has no available hours."). **Do not error out.**

**Final Output:**
Your response MUST be a single, valid JSON object containing \`timetable\`, \`conflicts\`, and \`report\` keys.
`,
});


export const generateTimetableFlow = ai.defineFlow(
  {
    name: 'generateTimetableFlow',
    inputSchema: GenerateTimetableInputSchema,
    outputSchema: GenerateTimetableOutputSchema,
  },
  async (input) => {
    const constraintsObject = JSON.parse(input.constraints);
    
    // Inject the current date into the constraints object to allow the AI to handle date-range constraints.
    constraintsObject.currentDate = new Date().toISOString();

    const updatedInput = {
      ...input,
      constraints: JSON.stringify(constraintsObject, null, 2), // Pretty-print for AI readability
    };
    
    const { output } = await generationPrompt(updatedInput);
    
    if (!output) {
        throw new Error("AI model returned no output.");
    }
    
    // Ensure the output conforms to the schema, even if the model messes up.
    // This provides a resilient structure that the frontend can always handle.
    return {
        timetable: output.timetable || [],
        conflicts: output.conflicts || [],
        report: output.report || "The AI model failed to generate a report, but the timetable (if any) is provided.",
    };
  }
);


export async function generateTimetable(input: GenerateTimetableInput): Promise<GenerateTimetableOutput> {
  return await generateTimetableFlow(input);
}
