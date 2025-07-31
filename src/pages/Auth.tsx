import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Building2, Users } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get the default tab from URL parameters
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Signup form
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '',
  });

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (profile?.role === 'IR_ADMIN') {
        navigate('/dashboard');
      } else {
        // Non-admin users go to events page
        navigate('/events');
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await signIn(loginData.email, loginData.password);
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      return;
    }

    setIsLoading(true);

    const result = await signUp(signupData.email, signupData.password, {
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      role: signupData.role,
    });

    setIsLoading(false);
    
    if (!result?.error) {
      setShowSignupSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {showSignupSuccess ? (
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">✓</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Account Created!</h1>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Welcome to AGORA</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              Your account has been successfully created. Please check your email to verify your account.
            </p>
          </div>

          <Card className="bg-gray-900 border border-gray-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-white">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-black text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Verify Your Email</p>
                    <p className="text-gray-400 text-xs">Check your inbox and click the verification link</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-black text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Subscribe to Sectors</p>
                    <p className="text-gray-400 text-xs">Set up your company and GICS sector subscriptions</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => navigate('/companies')}
                  className="w-full bg-yellow-400 text-black font-semibold py-2 h-10 hover:bg-yellow-500 transition-colors"
                >
                  Go to Company Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="flex items-center justify-center space-x-3 mb-4 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 bg-yellow-400 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AGORA</h1>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Event Coordination Platform</p>
            </div>
          </Link>
          <p className="text-gray-300 text-sm">
            Professional event coordination platform for investment analysts
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-gray-700">
            <TabsTrigger value="login" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black transition-colors">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-black transition-colors">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-white">Welcome Back</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10 pr-10"
                        placeholder="Enter your password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-gray-700 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-400 text-black font-semibold py-2 h-10 hover:bg-yellow-500 transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-gray-900 border border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-white">Create Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white text-sm">First Name</Label>
                      <Input
                        id="firstName"
                        value={signupData.firstName}
                        onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10"
                        placeholder="First name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white text-sm">Last Name</Label>
                      <Input
                        id="lastName"
                        value={signupData.lastName}
                        onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail" className="text-white text-sm">Email</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-white text-sm">Role</Label>
                    <Select
                      value={signupData.role}
                      onValueChange={(value) => setSignupData({ ...signupData, role: value })}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-yellow-400 focus:ring-yellow-400/20 h-10">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="IR_ADMIN" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4" />
                            <span>IR Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="ANALYST_MANAGER" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Analyst Manager</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="INVESTMENT_ANALYST" className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Investment Analyst</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword" className="text-white text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10 pr-10"
                        placeholder="Create a password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 hover:bg-gray-700 text-gray-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white text-sm">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 h-10"
                      placeholder="Confirm your password"
                    />
                  </div>

                  <div className="text-xs text-gray-400 text-center bg-gray-800 p-2 border border-gray-700">
                    You can update your company and GICS subscriptions in the Settings page after signing up.
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-400 text-black font-semibold py-2 h-10 hover:bg-yellow-500 transition-colors" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      )}
    </div>
  );
};

export default Auth;