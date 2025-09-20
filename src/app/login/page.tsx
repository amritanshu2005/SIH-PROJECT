'use client';

import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { DataContext } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Bot, Lock, ShieldCheck, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ClientOnly } from '@/components/client-only';
import type { UserRole } from '@/context/data-context';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setIsAuthenticated, setUserRole, setCurrentUser } = useContext(DataContext);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter your name.',
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Please enter a valid email address.',
      });
      return;
    }
    
    if (password.length < 1) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Password cannot be empty.',
        });
        return;
    }

    toast({
      title: 'Login Successful',
      description: `Welcome, ${name}! Redirecting to dashboard...`,
    });
    
    setCurrentUser({
      name,
      email,
      avatar: `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/40/40`,
    });
    setUserRole(activeRole);
    setIsAuthenticated(true);
    
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', activeRole);
    localStorage.setItem('currentUser', JSON.stringify({ name, email, avatar: `https://picsum.photos/seed/${name.replace(/\s/g, '-')}/40/40` }));
    
    router.push('/dashboard');
  };

  return (
    <ClientOnly>
      <div className="min-h-screen w-full bg-background font-body text-foreground">
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
                  <Check className="mr-2 h-4 w-4" />
                  NEP 2020 Compliant
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold font-headline tracking-tighter" style={{
                    background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--chart-2)))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                  Timetable Ace
                </h1>
                <p className="text-muted-foreground max-w-sm mx-auto">
                    The AI-powered scheduling solution for modern multidisciplinary education.
                </p>
              </div>

              <Card className="bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                  <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label>Select Your Role</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button type="button" variant={activeRole === 'admin' ? 'default' : 'outline'} onClick={() => setActiveRole('admin')}>Administrator</Button>
                        <Button type="button" variant={activeRole === 'faculty' ? 'default' : 'outline'} onClick={() => setActiveRole('faculty')}>Faculty</Button>
                        <Button type="button" variant={activeRole === 'student' ? 'default' : 'outline'} onClick={() => setActiveRole('student')}>Student</Button>
                      </div>
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" type="text" placeholder="e.g., Amritanshu Kumar" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="Enter your institutional email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember-me" />
                        <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
                      </div>
                      <Link href="#" className="text-sm text-primary hover:underline">Forgot Password?</Link>
                    </div>
                    <Button type="submit" className="w-full text-lg py-6 font-bold">
                      <Lock className="mr-2"/>
                      Secure Sign In
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <footer className="text-center text-xs text-muted-foreground">
                  <p>© 2025 Government of Jammu & Kashmir. All rights reserved.</p>
                  <p className="flex items-center justify-center gap-1"><Bot className="h-3 w-3"/> Powered by SmartTimetable NEP</p>
              </footer>
            </div>
        </div>
      </div>
    </ClientOnly>
  );
}
