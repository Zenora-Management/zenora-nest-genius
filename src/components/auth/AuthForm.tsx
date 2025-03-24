
import { useState } from "react";
import { Link } from "react-router-dom";
import { ZenoraButton } from "@/components/ui/button-zenora";
import { Eye, EyeOff, Lock, Mail, User, Building, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type AuthMode = "login" | "signup";
type UserType = "user" | "admin";

interface AuthFormProps {
  mode: AuthMode;
  userType: UserType;
}

// Pre-set admin credentials for demo purposes
const ADMIN_EMAIL = "zenoramgmt@gmail.com";
const ADMIN_PASSWORD = "Zenora101!";

// Define the login schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  companyCode: z.string().optional(),
});

// Extend the login schema for signup to include the name field
const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

// Define types based on the schemas
type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const AuthForm = ({ mode, userType }: AuthFormProps) => {
  const { signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [autoFilledAdmin, setAutoFilledAdmin] = useState(false);
  
  // Use the appropriate schema based on the mode
  const formSchema = mode === "login" ? loginSchema : signupSchema;
  
  // Create the form with the correct type
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: userType === "admin" ? ADMIN_EMAIL : "",
      password: userType === "admin" ? ADMIN_PASSWORD : "",
      companyCode: "",
      ...(mode === "signup" ? { fullName: "" } : {}),
    }
  });
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (mode === "login") {
        await signIn(values.email, values.password, userType === "admin");
      } else {
        // We need to cast to access the fullName field which only exists in signup mode
        const signupValues = values as SignupFormValues;
        await signUp(signupValues.email, signupValues.password, signupValues.fullName);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // Error handling is done in the AuthContext
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Auto-fill admin credentials when admin mode is selected
  const handleAdminAutoFill = () => {
    if (userType === "admin" && !autoFilledAdmin) {
      form.setValue("email", ADMIN_EMAIL);
      form.setValue("password", ADMIN_PASSWORD);
      setAutoFilledAdmin(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="zenora-card p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-zenora-gradient flex items-center justify-center shadow-lg mb-4">
            {userType === "admin" ? (
              <ShieldCheck className="h-6 w-6 text-white" onClick={handleAdminAutoFill} />
            ) : (
              <Building className="h-6 w-6 text-white" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            {mode === "login" ? "Sign In" : "Sign Up"}
            {userType === "admin" && mode === "login" && " as Administrator"}
            {userType === "user" && mode === "login" && " as Property Owner"}
          </h1>
          
          <p className="text-muted-foreground">
            {mode === "login" 
              ? `Sign in to access your ${userType === "admin" ? "admin portal" : "dashboard"}` 
              : "Join Zenora to start managing your properties"
            }
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {mode === "signup" && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <input
                          {...field}
                          type="text"
                          className="zenora-input pl-10"
                          placeholder="John Doe"
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <User className="h-5 w-5" />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <input
                        {...field}
                        type="email"
                        className="zenora-input pl-10"
                        placeholder="john@example.com"
                      />
                    </FormControl>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Mail className="h-5 w-5" />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        className="zenora-input pl-10"
                        placeholder="••••••••"
                      />
                    </FormControl>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {userType === "admin" && (
              <FormField
                control={form.control}
                name="companyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrator Code</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <input
                          {...field}
                          type="text"
                          className="zenora-input pl-10"
                          placeholder="Enter company admin code"
                        />
                      </FormControl>
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {userType === "admin" && "For Zenora demo, use any code."}
                    </p>
                  </FormItem>
                )}
              />
            )}
            
            {mode === "login" && (
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-zenora-purple hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
            
            <ZenoraButton 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                mode === "login" ? "Sign In" : "Create Account"
              )}
            </ZenoraButton>
          </form>
        </Form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zenora-dark text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["Google", "Apple", "Microsoft"].map((provider) => (
              <button
                key={provider}
                type="button"
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-foreground bg-white dark:bg-zenora-dark hover:bg-gray-50 dark:hover:bg-black/20"
              >
                {provider}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link 
              to={mode === "login" ? "/signup" : "/login"} 
              className="font-semibold text-zenora-purple hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
