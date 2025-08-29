import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<'client' | 'freelancer' | 'company_admin'>('client');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) {
      if (window.location.pathname.includes('admin')) {
        window.location.href = '/admin.html';
      } else if (window.location.pathname.includes('guard')) {
        window.location.href = '/guard.html';
      } else {
        window.location.href = '/client.html';
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isSignUp) {
        const result = await signUp(email, password, firstName, lastName, userType);
        if (result.error) {
          setErrorMsg(result.error.message || 'Authentication failed.');
          toast.error(result.error.message || 'Authentication failed.');
        } else {
          toast.success('Account created! Check your email.');
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setErrorMsg(result.error.message || 'Authentication failed.');
          toast.error(result.error.message || 'Authentication failed.');
        } else {
          toast.success('Login successful!');
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Unexpected error.');
      toast.error(error.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Sign up to get started.' : 'Sign in to your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-center">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="flex gap-2">
                <div className="w-1/2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {isSignUp && (
              <div>
                <Label htmlFor="userType">Account Type</Label>
                <Select value={userType} onValueChange={v => setUserType(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
            <div className="text-center mt-2">
              <Button type="button" variant="link" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Already have an account? Sign In' : 'No account? Create one'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;