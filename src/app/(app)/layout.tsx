
"use client";
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { AppSidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";
import { Chatbot } from "@/components/chatbot";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookUser, Briefcase, DraftingCompass, BellRing, CircleDollarSign, CalendarCheck, Lightbulb, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataContext, DataProvider, Notification } from "@/context/data-context";
import { ClientOnly } from '@/components/client-only';
import { useEffect, useState, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const notificationTemplates = {
  internships: {
    icons: [Briefcase, Award],
    titles: ["New Internship Opportunity", "Hiring Alert: Summer Interns", "Exclusive Internship Role"],
    companies: ["Innovate Inc.", "QuantumLeap", "CodeGenius", "Future Systems", "DataWise"],
    roles: ["Software Engineer Intern", "Data Analyst Intern", "UX/UI Design Intern", "Project Manager Intern"],
  },
  workshops: {
    icons: [DraftingCompass, Lightbulb],
    titles: ["Skill-Up Workshop", "Expert Session", "Hands-On Workshop"],
    topics: ["Advanced React Patterns", "Machine Learning Basics", "Public Speaking", "UI Component Design", "Ethical Hacking"],
  },
  announcements: {
    icons: [BellRing, CalendarCheck],
    titles: ["Campus Announcement", "Upcoming Event", "Mark Your Calendar"],
    events: ["Tech Fest 'Innovate 2025'", "Annual Sports Meet", "Cultural Night 'Spectrum'", "Alumni Homecoming"],
  },
  deadlines: {
    icons: [CircleDollarSign, CalendarCheck],
    titles: ["Fee Payment Reminder", "Submission Deadline", "Important Deadline"],
    tasks: ["Semester Fee Payment", "Project Synopsis Submission", "Scholarship Application"],
  }
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomNotification(): Notification {
    const categories = Object.keys(notificationTemplates) as (keyof typeof notificationTemplates)[];
    const randomCategory = getRandomElement(categories);
    const template = notificationTemplates[randomCategory];
    
    const icon = getRandomElement(template.icons);
    const title = getRandomElement(template.titles);
    const notificationDate = new Date();
    notificationDate.setDate(notificationDate.getDate() + Math.floor(Math.random() * 30));
    const formattedDate = notificationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let description = "";

    switch(randomCategory) {
        case 'internships':
            const company = getRandomElement(template.companies);
            const role = getRandomElement(template.roles);
            description = `New positions for ${role} are open at ${company}. Apply by ${formattedDate}!`;
            break;
        case 'workshops':
            const topic = getRandomElement(template.topics);
            description = `Join the workshop on ${topic} this coming week. Limited seats available.`;
            break;
        case 'announcements':
            const event = getRandomElement(template.events);
            description = `${event} is scheduled for next month. Registrations open soon.`;
            break;
        case 'deadlines':
            const task = getRandomElement(template.tasks);
            description = `The deadline for ${task} is ${formattedDate}. Please complete it on time.`;
            break;
    }

    return { icon, title, description, date: new Date() };
}


function NotificationHandler() {
  const { toast } = useToast();
  const { setNotificationHistory } = useContext(DataContext);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const interval = setInterval(() => {
        const randomNotification = generateRandomNotification();

        toast({
          title: (
              <div className="flex items-center gap-2">
                  <randomNotification.icon className="h-5 w-5 text-primary" />
                  <span className="font-bold">{randomNotification.title}</span>
              </div>
          ),
          description: randomNotification.description,
        });
        
        setNotificationHistory(prevHistory => [randomNotification, ...prevHistory].slice(0, 5));

    }, 20000); // 20 seconds

    return () => clearInterval(interval);
  }, [hasMounted, toast, setNotificationHistory]);

  return null;
}


function AppLayoutContent({ children }: { children: React.ReactNode }) {
    const { currentUser } = useContext(DataContext);
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    useEffect(() => {
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        if (!authStatus) {
            router.replace('/login');
        } else {
            setIsCheckingAuth(false);
        }
    }, [router]);
    
    if (isCheckingAuth) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <SidebarProvider>
              <div className="flex h-screen w-full">
                <Sidebar
                  variant="inset"
                  className="group"
                >
                  <div className="flex h-full flex-col shadow-sm">
                    <SidebarHeader className="p-4 flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-accent-foreground bg-accent hover:bg-accent/80">
                        <BookUser className="h-6 w-6" />
                      </Button>
                      <div className="group-data-[collapsible=icon]:hidden">
                        <h1 className="font-headline text-lg font-semibold">Timetable Ace</h1>
                      </div>
                    </SidebarHeader>
                    <SidebarContent className="p-2">
                      <AppSidebarNav />
                    </SidebarContent>
                    <SidebarFooter className="p-4 border-t border-sidebar-border">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8">
                            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                         </Avatar>
                         <div className="group-data-[collapsible=icon]:hidden">
                            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                         </div>
                       </div>
                    </SidebarFooter>
                  </div>
                </Sidebar>
                <div className="flex flex-col flex-1 min-w-0 relative">
                  <AppHeader />
                  <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                  </main>
                  <Chatbot />
                </div>
              </div>
            </SidebarProvider>
    );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <DataProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <NotificationHandler />
            <AppLayoutContent>{children}</AppLayoutContent>
            <Toaster />
        </ThemeProvider>
      </DataProvider>
    </ClientOnly>
  );
}
