
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuthForm from "@/components/auth/AuthForm";
import { useEffect, useState } from "react";
import { authBypass } from "@/utils/auth-bypass";
import { ZenoraButton } from "@/components/ui/button-zenora";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === "/signup";
  const [isTestEnvironment, setIsTestEnvironment] = useState(false);
  const [bypassClicks, setBypassClicks] = useState(0);
  const [showBypass, setShowBypass] = useState(false);
  const [loginType, setLoginType] = useState<"user" | "admin">("user");

  // Check if it's a development/test environment
  useEffect(() => {
    setIsTestEnvironment(process.env.NODE_ENV === 'development');
    // In development, show bypass button more easily
    if (process.env.NODE_ENV === 'development') {
      setShowBypass(true);
    }
  }, []);

  // Handle bypass login for testing
  const handleBypassLogin = (type: "user" | "admin") => {
    if (authBypass.enable(type)) {
      navigate(type === "admin" ? "/admin" : "/dashboard");
    }
  };

  // Handle logo clicks to show the bypass button
  const handleLogoClick = () => {
    if (isTestEnvironment) {
      setBypassClicks(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setShowBypass(true);
        }
        return newCount;
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-16 bg-gradient-to-b from-white to-gray-50 dark:from-zenora-dark dark:to-black relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-zenora-light opacity-5 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-zenora-purple opacity-5 blur-3xl rounded-full"></div>
        
        <div className="zenora-container relative z-10">
          <div className="text-center mb-8 animate-slide-in">
            <div 
              className="inline-block cursor-pointer"
              onClick={handleLogoClick}
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-zenora-gradient">
                {isSignUp ? "Create Your Account" : "Welcome Back"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isSignUp 
                ? "Sign up to access your AI-powered property management dashboard" 
                : "Sign in to access your AI-powered property management dashboard"
              }
            </p>
          </div>
          
          <div className="animate-scale-in">
            {!isSignUp && (
              <Tabs defaultValue="user" onValueChange={(value) => setLoginType(value as "user" | "admin")} className="w-full mb-6">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="user">Property Owner</TabsTrigger>
                  <TabsTrigger value="admin">Administrator</TabsTrigger>
                </TabsList>
                <TabsContent value="user">
                  <AuthForm mode="login" userType="user" />
                </TabsContent>
                <TabsContent value="admin">
                  <AuthForm mode="login" userType="admin" />
                </TabsContent>
              </Tabs>
            )}
            
            {isSignUp && (
              <AuthForm mode="signup" userType="user" />
            )}
          </div>
          
          {isTestEnvironment && showBypass && (
            <div className="mt-8 text-center">
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <p className="text-xs text-amber-600 mb-2">Testing Environment Only</p>
                <div className="flex justify-center gap-4">
                  <ZenoraButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleBypassLogin("user")}
                    className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                  >
                    Bypass as User
                  </ZenoraButton>
                  <ZenoraButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleBypassLogin("admin")}
                    className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
                  >
                    Bypass as Admin
                  </ZenoraButton>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center mt-8 text-sm text-muted-foreground">
            By {isSignUp ? "signing up" : "signing in"}, you agree to our{" "}
            <Link to="/terms" className="text-zenora-purple hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-zenora-purple hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
