
import * as z from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ZenoraButton } from "@/components/ui/button-zenora";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface AuthFormProps {
  mode: "login" | "signup";
  userType?: "regular" | "admin";
}

// Admin credentials
const ADMIN_EMAIL = "zenoramgmt@gmail.com";
const ADMIN_PASSWORD = "Zenora101!";

// Define the login schema with only email, password and optional companyCode
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  companyCode: z.string().optional(),
});

// Define the signup schema with all fields including fullName
const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  companyCode: z.string().optional(),
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
});

// Define types based on the schemas
type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const AuthForm = ({ mode, userType }: AuthFormProps) => {
  const { signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [autoFilledAdmin, setAutoFilledAdmin] = useState(false);
  const navigate = useNavigate();
  
  // Use the appropriate schema and initial values based on the mode
  const isSignup = mode === "signup";
  
  // Define the form with conditional type
  const form = isSignup
    ? useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
          email: "",
          password: "",
          companyCode: "",
          fullName: "",
        }
      })
    : useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
          email: userType === "admin" ? ADMIN_EMAIL : "",
          password: userType === "admin" ? ADMIN_PASSWORD : "",
          companyCode: "",
        }
      });
  
  // Auto-fill admin credentials if userType is admin
  useEffect(() => {
    if (userType === "admin" && !autoFilledAdmin) {
      form.setValue("email", ADMIN_EMAIL);
      form.setValue("password", ADMIN_PASSWORD);
      setAutoFilledAdmin(true);
    }
  }, [userType, form, autoFilledAdmin]);
  
  const onSubmit = async (values: LoginFormValues | SignupFormValues) => {
    try {
      if (!isSignup) {
        // Login flow
        const loginValues = values as LoginFormValues;
        await signIn(loginValues.email, loginValues.password, userType === "admin");
      } else {
        // Signup flow
        const signupValues = values as SignupFormValues;
        await signUp(signupValues.email, signupValues.password, signupValues.fullName);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="your.email@example.com"
                  {...field}
                  disabled={userType === "admin" && !!autoFilledAdmin}
                />
              </FormControl>
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
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                    disabled={userType === "admin" && !!autoFilledAdmin}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {isSignup && (
          <FormField
            control={form.control as any}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <ZenoraButton type="submit" className="w-full" disabled={loading}>
          {loading ? "Processing..." : isSignup ? "Sign Up" : "Log In"}
        </ZenoraButton>
      </form>
    </Form>
  );
};

export default AuthForm;
