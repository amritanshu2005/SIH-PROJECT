
"use client";

import { useState, useContext } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { runGenerateTimetable } from "@/app/actions";
import { DataContext } from "@/context/data-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TimetableGrid } from "@/components/timetable-grid";
import { Loader2, Wand2, Users, GraduationCap, BookOpen, DoorOpen, ExternalLink, Beaker, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Student } from "@/lib/types";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { students, faculty, courses, rooms, timetableResult, setTimetableResult, constraints, scenario, userRole } = useContext(DataContext);

  const dataSummary = [
    { title: "Students", count: students.length, icon: Users, link: "/data" },
    { title: "Faculty", count: faculty.length, icon: GraduationCap, link: "/data" },
    { title: "Courses", count: courses.length, icon: BookOpen, link: "/data" },
    { title: "Rooms", count: rooms.length, icon: DoorOpen, link: "/data" },
  ]
  
  const { facultyOnLeave, unavailableRooms, studentPopularity, facultyWorkload } = scenario;
  const isSimulationActive = facultyOnLeave.length > 0 || unavailableRooms.length > 0 || studentPopularity.courseId || facultyWorkload.facultyId;

  // Check if program-specific constraints are active
  const { teachingPractice, fieldWork } = constraints.programSpecific;
  const isProgramConstraintActive = 
    (teachingPractice.program && teachingPractice.day) ||
    (fieldWork.program && fieldWork.startDate && fieldWork.endDate);


  const getSimulationDescription = () => {
    const parts = [];
    if (facultyOnLeave.length > 0) parts.push(`Faculty on leave: ${facultyOnLeave.length}`);
    if (unavailableRooms.length > 0) parts.push(`Unavailable rooms: ${unavailableRooms.length}`);
    if (studentPopularity.courseId) {
        const course = courses.find(c => c.id === studentPopularity.courseId);
        if (course) parts.push(`Forecast: ${course.code} demand +${studentPopularity.increase}%`);
    }
    if (facultyWorkload.facultyId) {
        const fac = faculty.find(f => f.name === facultyWorkload.facultyId);
        if (fac) parts.push(`Forecast: ${fac.name.split(' ')[1]} load to ${facultyWorkload.newWorkload} hrs`);
    }
    return parts.join('. ');
  }

  const getProgramConstraintDescription = () => {
    const parts = [];
    if (teachingPractice.program && teachingPractice.day) {
      parts.push(`Teaching Practice (${teachingPractice.program}) is scheduled every ${teachingPractice.day} from ${teachingPractice.startTime} to ${teachingPractice.endTime}.`);
    }
    if (fieldWork.program && fieldWork.startDate && fieldWork.endDate) {
      parts.push(`${fieldWork.activityType} for ${fieldWork.program} is scheduled from ${format(new Date(fieldWork.startDate), "LLL dd")} to ${format(new Date(fieldWork.endDate), "LLL dd, y")}.`);
    }
    return parts.join(' ');
  }

  async function onGenerate() {
    setIsLoading(true);
    setTimetableResult(null);

    // --- Apply scenario simulations for this generation ---
    let simulatedFaculty = faculty.filter(f => !facultyOnLeave.includes(f.id));
    let simulatedRooms = rooms.filter(r => !unavailableRooms.includes(r.id));
    let simulatedStudents = JSON.parse(JSON.stringify(students)); // Deep copy

    // Forecast: Faculty Workload Change
    if (facultyWorkload.facultyId) {
        simulatedFaculty = simulatedFaculty.map(f =>
            f.name === facultyWorkload.facultyId ? { ...f, workload: facultyWorkload.newWorkload } : f
        );
    }
    
    // Forecast: Elective Popularity
    if (studentPopularity.courseId && studentPopularity.increase > 0) {
        const courseToBoost = courses.find(c => c.id === studentPopularity.courseId);
        if (courseToBoost) {
            const increaseCount = Math.floor(students.length * (studentPopularity.increase / 100));
            const studentsToModify = simulatedStudents
                .filter((s: Student) => !s.electiveChoices.includes(courseToBoost.code))
                .slice(0, increaseCount);

            studentsToModify.forEach((s: Student) => {
                if (s.electiveChoices.length > 0) {
                    s.electiveChoices.pop(); // Simple logic: replace last elective
                }
                s.electiveChoices.push(courseToBoost.code);
            });
        }
    }
    // --- End of Simulation Logic ---

    const input = {
      studentData: JSON.stringify(simulatedStudents),
      facultyData: JSON.stringify(simulatedFaculty),
      courseData: JSON.stringify(courses),
      roomData: JSON.stringify(simulatedRooms),
      constraints: JSON.stringify(constraints),
    };

    try {
      const response = await runGenerateTimetable(input);
      if (response.success && response.data) {
        setTimetableResult({
          timetable: response.data.timetable,
          conflicts: response.data.conflicts,
          report: response.data.report,
        });
        toast({
          title: "Timetable Generated Successfully",
          description: isSimulationActive 
            ? "Generated with temporary simulation settings." 
            : "The system has created a new timetable schedule.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Timetable Generation Failed",
          description: response.error || "An unknown error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Timetable Generation Failed",
        description:
          "An unexpected error occurred while running the generation.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Smart Timetable Generator</CardTitle>
          <CardDescription>
            Input your institutional data and constraints, then let the AI build an optimized timetable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {dataSummary.map((item) => (
              <Card key={item.title} className="interactive-element">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <h3 className="text-sm font-medium">{item.title}</h3>
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground">records available</p>
                  {userRole === 'admin' && (
                    <Link href={item.link}>
                        <Button variant="outline" size="sm" className="mt-4 w-full">
                          Manage <ExternalLink className="ml-2 h-3 w-3"/>
                        </Button>
                    </Link>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {isSimulationActive && (
              <Alert variant="default" className="border-primary/50 bg-primary/5">
                <Beaker className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Simulation Mode Active</AlertTitle>
                <AlertDescription className="text-primary/80">
                  {getSimulationDescription()}
                  <Link href="/constraints" className="ml-2 font-semibold underline">Edit Scenarios</Link>
                </AlertDescription>
              </Alert>
          )}

          {isProgramConstraintActive && (
              <Alert variant="default" className="border-accent-foreground/50 bg-accent/20">
                <Clock className="h-4 w-4 text-accent-foreground" />
                <AlertTitle className="text-accent-foreground font-bold">Program Constraint Active</AlertTitle>
                <AlertDescription className="text-accent-foreground/80">
                  {getProgramConstraintDescription()}
                  <Link href="/constraints" className="ml-2 font-semibold underline">Edit Constraints</Link>
                </AlertDescription>
              </Alert>
          )}
          
          {userRole === 'admin' && (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row md:justify-between md:text-left">
                <div>
                  <h3 className="text-lg font-semibold">Ready to Go?</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the current data and constraints to generate a new schedule.
                  </p>
                </div>
                <Button onClick={onGenerate} disabled={isLoading} size="lg">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    isSimulationActive ? <Beaker className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {isSimulationActive ? 'Run Simulation' : 'Generate Timetable'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-xl font-bold tracking-tight">Generating Timetable...</h3>
            <p className="text-sm text-muted-foreground">The AI is scheduling classes. This may take a moment.</p>
        </div>
      )}

      {timetableResult && (
        <TimetableGrid 
          timetable={timetableResult.timetable}
          conflicts={timetableResult.conflicts}
          report={timetableResult.report}
        />
      )}
    </div>
  );
}
