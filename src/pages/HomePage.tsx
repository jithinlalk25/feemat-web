import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { timezones } from "@/lib/timezones";
import { Eye, EyeOff } from "lucide-react";
import ApiService from "@/lib/api/api";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [showOTP, setShowOTP] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8">
      <Card className="w-[400px]">
        <CardHeader>
          <h1 className="text-2xl font-bold text-black text-center mb-4">
            Feemat
          </h1>
          <CardTitle>
            {showOTP ? "Verify Email" : isSignIn ? "Sign In" : "Sign Up"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showOTP ? (
            <OTPForm
              email={signupEmail}
              onBack={() => setShowOTP(false)}
              setIsSignIn={setIsSignIn}
            />
          ) : isSignIn ? (
            <SignInForm />
          ) : (
            <SignUpForm
              onSignupSuccess={(email) => {
                setSignupEmail(email);
                setShowOTP(true);
              }}
            />
          )}
          {!showOTP && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsSignIn(!isSignIn)}
                className="text-sm text-blue-500 hover:underline"
              >
                {isSignIn
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
      <SupportContact />
    </div>
  );
}

function SupportContact() {
  return (
    <div className="mt-6 text-center text-sm text-gray-600">
      <p>Having trouble? Contact our support</p>
      <p className="mt-1">
        <a
          href="mailto:support@feemat.com"
          className="text-blue-500 hover:underline"
        >
          support@feemat.com
        </a>
      </p>
      <div className="mt-1 flex items-center justify-center gap-3">
        <a
          href="tel:+917356245819"
          className="text-blue-500 hover:underline flex items-center gap-1"
        >
          <span>📞</span> Call
        </a>
        <span className="text-gray-400">|</span>
        <a
          href="https://wa.me/917356245819"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline flex items-center gap-1"
        >
          <span>💬</span> WhatsApp
        </a>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      await ApiService.signin({
        email,
        password,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>
      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

function SignUpForm({
  onSignupSuccess,
}: {
  onSignupSuccess: (email: string) => void;
}) {
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

    return {
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar,
      requirements: {
        minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumber,
        hasSpecialChar,
      },
    };
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      const errors = [];
      if (!validation.requirements.minLength)
        errors.push("at least 8 characters");
      if (!validation.requirements.hasUpperCase)
        errors.push("one uppercase letter");
      if (!validation.requirements.hasLowerCase)
        errors.push("one lowercase letter");
      if (!validation.requirements.hasNumber) errors.push("one number");
      if (!validation.requirements.hasSpecialChar)
        errors.push("one special character");
      setPasswordError(`Password must contain ${errors.join(", ")}`);
    } else {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value !== password) {
      setConfirmPasswordError("Passwords do not match");
    } else {
      setConfirmPasswordError("");
    }
  };

  useEffect(() => {
    // Get user's timezone using Intl.DateTimeFormat
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("Detected user timezone:", userTimeZone);

    // Find matching timezone in our list
    const matchingTimezone = timezones.find((tz) => tz.value === userTimeZone);
    console.log("Found matching timezone:", matchingTimezone);

    if (matchingTimezone) {
      setSelectedTimezone(matchingTimezone.value);
      console.log("Set selected timezone to:", matchingTimezone.value);
    } else {
      // Fallback to a default timezone if no match is found
      const defaultTimezone = timezones.find(
        (tz) => tz.value === "America/New_York"
      );
      if (defaultTimezone) {
        setSelectedTimezone(defaultTimezone.value);
        console.log("No match found, falling back to:", defaultTimezone.value);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmPasswordError("");
    setError("");

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setPasswordError("Password does not meet requirements");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    const emailInput = e.currentTarget.querySelector(
      "#email"
    ) as HTMLInputElement;
    const companyNameInput = e.currentTarget.querySelector(
      "#companyName"
    ) as HTMLInputElement;

    const email = emailInput.value;
    const companyName = companyNameInput.value;

    try {
      setIsLoading(true);
      await ApiService.signup({
        email,
        password,
        companyName,
        timezone: selectedTimezone,
      });
      onSignupSuccess(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        {passwordError && (
          <p className="text-sm text-red-500 mt-1">{passwordError}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Password must contain at least 8 characters, one uppercase letter, one
          lowercase letter, one number, and one special character.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-gray-500" />
            ) : (
              <Eye className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>
        {confirmPasswordError && (
          <p className="text-sm text-red-500 mt-1">{confirmPasswordError}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          type="text"
          placeholder="Enter your company name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
          <SelectTrigger>
            <SelectValue placeholder="Select your timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((timezone) => (
              <SelectItem key={timezone.value} value={timezone.value}>
                {timezone.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" disabled={isLoading}>
        {isLoading ? "Signing up..." : "Sign Up"}
      </Button>
    </form>
  );
}

function OTPForm({
  email,
  onBack,
  setIsSignIn,
}: {
  email: string;
  onBack: () => void;
  setIsSignIn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);
      await ApiService.verifyOTP({
        email,
        otp,
      });
      setIsVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="space-y-4 text-center">
        <div className="py-4">
          <h3 className="text-lg font-medium text-green-600 mb-2">
            Email Verified Successfully!
          </h3>
          <p className="text-sm text-gray-600">
            Your account has been created. Please sign in to continue.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            onBack();
            // Force sign in view
            setIsSignIn(true);
          }}
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          type="text"
          placeholder="Enter verification code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          className="text-center text-lg tracking-widest"
        />
      </div>
      <p className="text-sm text-gray-500 text-center">
        We've sent a verification code to {email}
      </p>
      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify"}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Back to Sign Up
      </button>
    </form>
  );
}
