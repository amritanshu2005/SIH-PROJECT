
import { z } from 'zod';
import { TimetableEntrySchema, ConflictSchema } from '@/lib/types';

export const GenerateTimetableInputSchema = z.object({
  studentData: z.string().describe('Student data in JSON format, including elective choices and enrolled credits.'),
  facultyData: z.string().describe('Faculty data in JSON format.'),
  courseData: z.string().describe('Course data in JSON format, including course codes, credits, and theory/practical split.'),
  roomData: z.string().describe('Room data in JSON format, including capacity.'),
  constraints: z.string().describe('Constraints in JSON format. This includes faculty workload, availability, and expertise; room/lab availability; and schedules for teaching practice, field work, internships, etc.'),
});

export const GenerateTimetableOutputSchema = z.object({
  timetable: z.array(TimetableEntrySchema).describe('The generated timetable as an array of schedule entry objects.'),
  conflicts: z.array(ConflictSchema).describe('Any scheduling conflicts detected, as an array of conflict objects.'),
  report: z.string().describe('A report on timetable efficiency and resource utilization, or an explanation for failure.'),
});
