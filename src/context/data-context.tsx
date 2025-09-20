
"use client";

import { createContext, useState, ReactNode, useEffect } from "react";
import { mockStudents, mockFaculty, mockCourses, mockRooms } from "@/lib/data";
import { Student, Faculty, Course, Room, TimetableGenerationResult, AuditLog } from "@/lib/types";

// Define a type for the constraints for better type safety
export type Constraints = {
  faculty: any;
  room: any;
  course: any;
  programSpecific: {
    teachingPractice: {
        program: string;
        day: string;
        startTime: string;
        endTime: string;
    };
    fieldWork: {
        activityType: string;
        program: string;
        startDate?: Date;
        endDate?: Date;
    };
  };
};

export type Notification = {
    icon: React.ElementType;
    title: string;
    description: string;
    date: Date;
};

export type Scenario = {
  facultyOnLeave: string[];
  unavailableRooms: string[];
  studentPopularity: { courseId: string; increase: number };
  facultyWorkload: { facultyId: string; newWorkload: number };
};

export type UserRole = 'admin' | 'faculty' | 'student';

export type UserProfile = {
  name: string;
  email: string;
  avatar: string;
}

const initialUser: UserProfile = {
  name: 'Guest',
  email: '',
  avatar: ''
};

const initialConstraints: Constraints = {
  faculty: {},
  room: {},
  course: {},
  programSpecific: {
    teachingPractice: {
        program: '',
        day: '',
        startTime: '',
        endTime: '',
    },
    fieldWork: {
        activityType: 'Internship',
        program: '',
        startDate: undefined,
        endDate: undefined,
    },
  }
};

const initialScenario: Scenario = {
    facultyOnLeave: [],
    unavailableRooms: [],
    studentPopularity: { courseId: '', increase: 0 },
    facultyWorkload: { facultyId: '', newWorkload: 8 },
}


type DataContextType = {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  faculty: Faculty[];
  setFaculty: React.Dispatch<React.SetStateAction<Faculty[]>>;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  timetableResult: TimetableGenerationResult | null;
  setTimetableResult: (value: TimetableGenerationResult | null) => void;
  constraints: Constraints;
  setConstraints: React.Dispatch<React.SetStateAction<Constraints>>;
  notificationHistory: Notification[];
  setNotificationHistory: React.Dispatch<React.SetStateAction<Notification[]>>;
  scenario: Scenario;
  setScenario: React.Dispatch<React.SetStateAction<Scenario>>;
  userRole: UserRole;
  setUserRole: React.Dispatch<React.SetStateAction<UserRole>>;
  auditLogs: AuditLog[];
  addAuditLog: (log: AuditLog) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  currentUser: UserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile>>;
};

export const DataContext = createContext<DataContextType>({
  students: [],
  setStudents: () => {},
  faculty: [],
  setFaculty: () => {},
  courses: [],
  setCourses: () => {},
  rooms: [],
  setRooms: () => {},
  searchTerm: "",
  setSearchTerm: () => {},
  timetableResult: null,
  setTimetableResult: () => {},
  constraints: initialConstraints,
  setConstraints: () => {},
  notificationHistory: [],
  setNotificationHistory: () => {},
  scenario: initialScenario,
  setScenario: () => {},
  userRole: 'admin',
  setUserRole: () => {},
  auditLogs: [],
  addAuditLog: () => {},
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  currentUser: initialUser,
  setCurrentUser: () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [faculty, setFaculty] = useState<Faculty[]>(mockFaculty);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [searchTerm, setSearchTerm] = useState("");
  const [timetableResult, setTimetableResult] = useState<TimetableGenerationResult | null>(null);
  const [constraints, setConstraints] = useState<Constraints>(initialConstraints);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialUser);


  useEffect(() => {
    // On initial load, check localStorage to rehydrate auth state
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedUser = localStorage.getItem('currentUser');
    if (storedAuth) {
        setIsAuthenticated(true);
        if (storedRole) {
            setUserRole(storedRole);
        }
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }
  }, []);

  // Effect to manage timetable persistence based on user role
  useEffect(() => {
    if (userRole === 'admin') {
      // Admins should always see a clean slate, so clear the timetable from state.
      // We don't clear localStorage so students/faculty can still see it.
      setTimetableResult(null);
    } else {
      // Students and Faculty should see the last generated timetable.
      const savedTimetable = localStorage.getItem('timetableResult');
      if (savedTimetable) {
        setTimetableResult(JSON.parse(savedTimetable));
      }
    }
  }, [userRole]);


  const handleSetTimetableResult = (value: TimetableGenerationResult | null) => {
    if (value) {
        // When an admin generates a timetable, save it for others to see.
        localStorage.setItem('timetableResult', JSON.stringify(value));
    } else {
        // Allow explicit clearing if needed (e.g., logging out everyone)
        localStorage.removeItem('timetableResult');
    }
    setTimetableResult(value);
  }


  const addAuditLog = (log: AuditLog) => {
    setAuditLogs(prevLogs => [log, ...prevLogs]);
  }

  return (
    <DataContext.Provider value={{ 
        students, setStudents, 
        faculty, setFaculty, 
        courses, setCourses, 
        rooms, setRooms, 
        searchTerm, setSearchTerm,
        timetableResult, 
        setTimetableResult: handleSetTimetableResult,
        constraints, setConstraints,
        notificationHistory, setNotificationHistory,
        scenario, setScenario,
        userRole, setUserRole,
        auditLogs, addAuditLog,
        isAuthenticated, setIsAuthenticated,
        currentUser, setCurrentUser
    }}>
      {children}
    </DataContext.Provider>
  );
};
