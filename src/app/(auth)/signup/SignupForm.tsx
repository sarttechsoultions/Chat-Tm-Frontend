"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Plus } from "lucide-react";
import CenteredAuthFrame, {
  AuthLogo,
  StepIndicator,
  authInputClass,
  authSelectClass,
  primaryButtonClass,
} from "../../../components/auth/CenteredAuthFrame";
import { ApiError, identifierToSignupFields, setSession, signupRequest } from "../../../lib/auth";

const TOTAL_STEPS = 5;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const GENDERS = ["Male", "Female", "Custom"] as const;

function daysInMonth(month: number, year: number) {
  if (!month || !year) return 31;
  return new Date(year, month, 0).getDate();
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState<(typeof GENDERS)[number] | "">("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(searchParams.get("ref") || "");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 88 }, (_, index) => String(currentYear - 13 - index)),
    [currentYear],
  );
  const days = useMemo(() => {
    const count = daysInMonth(Number(month), Number(year));
    return Array.from({ length: count }, (_, index) => String(index + 1).padStart(2, "0"));
  }, [month, year]);

  function goNext() {
    setError("");
    if (currentStep === 1) {
      if (!firstName.trim() || !identifier.trim()) {
        setError("Please fill in your name and email or phone.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!day || !month || !year) {
        setError("Please select your date of birth.");
        return;
      }
    }
    if (currentStep === 3) {
      if (username.trim().length < 3) {
        setError("Username must be at least 3 characters.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
  }

  function goBack() {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      setError("Photo must be 800KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function completeSignup() {
    setError("");
    setLoading(true);
    try {
      const monthValue = month.padStart(2, "0");
      const result = await signupRequest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        password,
        dateOfBirth: year && month && day ? `${year}-${monthValue}-${day.padStart(2, "0")}` : undefined,
        gender: gender || undefined,
        bio: bio.trim(),
        avatar,
        referralCode: referralCode.trim() || undefined,
        ...identifierToSignupFields(identifier),
      });
      setSession(result.token, result.user, true);
      router.replace("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to create account. Try again.";
      setError(message);
      if (message.toLowerCase().includes("username")) setCurrentStep(3);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CenteredAuthFrame>
      <AuthLogo />
      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {currentStep === 1 && (
        <div className="w-full flex flex-col items-center">
          <h1 className="text-[24px] font-bold text-[#0B1C30] mb-2">Create Account</h1>
          <p className="text-[#3C494A] text-[16px] mb-8 text-center">
            Let&apos;s get you set up with your unique identity.
          </p>
          <div className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={authInputClass}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={authInputClass}
            />
            <input
              type="text"
              placeholder="Email or Phone Number"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className={authInputClass}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="button" onClick={goNext} className={`w-full mt-2 ${primaryButtonClass}`}>
              Next
            </button>
          </div>
          <p className="text-center mt-8 text-sm text-[#0B1C30]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#00696F] font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      )}

      {currentStep === 2 && (
        <div className="w-full flex flex-col items-center">
          <h1 className="text-[32px] leading-10 font-bold text-[#0B1C30] mb-2">Personal Details</h1>
          <p className="text-[#3C494A] text-[16px] mb-8">Help us know you better.</p>
          <div className="w-full flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Date of Birth</label>
              <div className="flex gap-3">
                <select value={day} onChange={(event) => setDay(event.target.value)} className={authSelectClass}>
                  <option value="">Day</option>
                  {days.map((value) => (
                    <option key={value} value={value}>
                      {Number(value)}
                    </option>
                  ))}
                </select>
                <select value={month} onChange={(event) => setMonth(event.target.value)} className={authSelectClass}>
                  <option value="">Month</option>
                  {MONTHS.map((name, index) => (
                    <option key={name} value={String(index + 1)}>
                      {name}
                    </option>
                  ))}
                </select>
                <select value={year} onChange={(event) => setYear(event.target.value)} className={authSelectClass}>
                  <option value="">Year</option>
                  {years.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Gender</label>
              <div className="flex gap-3">
                {GENDERS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(option)}
                    className={`flex-1 h-[50px] border rounded-[10px] font-medium transition-colors ${
                      gender === option
                        ? "border-[#00696F] bg-[#E5F3F2] text-[#00696F]"
                        : "border-[#D8D2D2] text-[#0B1C30] hover:border-[#00696F]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex items-center gap-4 mt-2">
              <button type="button" onClick={goBack} className="font-semibold text-[#0B1C30] hover:text-gray-600 px-4">
                Back
              </button>
              <button type="button" onClick={goNext} className={`flex-1 ${primaryButtonClass}`}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="w-full flex flex-col items-center">
          <h1 className="text-[24px] font-bold text-[#0B1C30] mb-8">Choose a Username</h1>
          <div className="w-full flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Username</label>
              <input
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={authInputClass}
              />
              <p className="text-xs text-gray-500 mt-1">You can change this anytime in settings.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${authInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={`${authInputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex items-center gap-4 mt-2">
              <button type="button" onClick={goBack} className="font-semibold text-[#0B1C30] hover:text-gray-600 px-4">
                Back
              </button>
              <button type="button" onClick={goNext} className={`flex-1 ${primaryButtonClass}`}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="w-full flex flex-col items-center">
          <h1 className="text-[24px] font-bold text-[#0B1C30] mb-2">Enter Referral Code</h1>
          <p className="text-[#3C494A] text-[16px] mb-8 text-center">
            Enter a friend&apos;s referral code to earn credits on signup.
          </p>
          <div className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Referral code"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              className={authInputClass}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="button" onClick={goNext} className={`w-full ${primaryButtonClass}`}>
              Enter Referral
            </button>
            <button type="button" onClick={goNext} className="text-[#00696F] font-semibold hover:underline">
              Skip for now
            </button>
            <button type="button" onClick={goBack} className="font-semibold text-[#0B1C30] hover:text-gray-600">
              Back
            </button>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="w-full flex flex-col items-center">
          <h1 className="text-[24px] font-bold text-[#0B1C30] mb-2">Final Touches</h1>
          <p className="text-[#3C494A] text-[16px] mb-8 text-center">
            You&apos;re almost there! Just a few more things.
          </p>
          <div className="w-full flex flex-col items-center gap-6">
            <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handlePhoto} />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="relative size-[120px] rounded-full bg-[#EBF3F4] border border-dashed border-[#00696F] overflow-hidden flex items-center justify-center"
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Profile preview" className="size-full object-cover" />
              ) : (
                <Plus size={36} className="text-[#00696F]" />
              )}
            </button>
            <div className="w-full">
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Add a Bio</label>
              <textarea
                placeholder="What do you do? What are you working on?"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="w-full min-h-[100px] p-4 border border-[#D8D2D2] rounded-[10px] text-[#0B1C30] placeholder-gray-400 focus:outline-none focus:border-[#00696F] focus:ring-1 focus:ring-[#00696F] resize-none"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="w-full flex items-center gap-4 mt-2">
              <button type="button" onClick={goBack} className="font-semibold text-[#0B1C30] hover:text-gray-600 px-4">
                Back
              </button>
              <button type="button" onClick={completeSignup} disabled={loading} className={`flex-1 ${primaryButtonClass}`}>
                {loading ? "Creating account..." : "Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CenteredAuthFrame>
  );
}
