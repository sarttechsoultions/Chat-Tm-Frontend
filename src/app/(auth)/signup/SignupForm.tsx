"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Eye, EyeOff, Info, Loader2, Plus, X } from "lucide-react";
import CenteredAuthFrame, {
  AuthLogo,
  StepIndicator,
  authInputClass,
  authSelectClass,
  primaryButtonClass,
} from "../../../components/auth/CenteredAuthFrame";
import {
  ApiError,
  checkUsernameRequest,
  identifierToSignupFields,
  setSession,
  signupRequest,
  skipVerificationRequest,
  submitVerificationRequest,
} from "../../../lib/auth";

const TOTAL_STEPS = 6;
const DOCUMENT_TYPES = [
  { value: "PASSPORT", label: "Passport" },
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "AADHAAR", label: "Aadhaar Card" },
] as const;
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
  const documentInputRef = useRef<HTMLInputElement>(null);

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
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [documentType, setDocumentType] = useState("PASSPORT");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

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
      if (usernameStatus === "checking") {
        setError("Please wait while we check this username.");
        return;
      }
      if (usernameStatus !== "available") {
        setError(usernameMessage || "Please choose an available username.");
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

  function handleDocumentFile(file?: File | null) {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setError("Use SVG, PNG, JPG or WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Document must be 10MB or smaller.");
      return;
    }
    setError("");
    setDocumentFile(file);
    if (file.type === "image/svg+xml") {
      setDocumentPreview("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setDocumentPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function finishSignup(mode: "submit" | "skip") {
    setError("");
    if (mode === "submit" && !documentFile) {
      setError("Please upload a document photo.");
      return;
    }

    setLoading(true);
    try {
      if (!accountCreated) {
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
        setAccountCreated(true);
      }

      if (mode === "submit" && documentFile) {
        await submitVerificationRequest(documentType, documentFile);
      } else {
        await skipVerificationRequest().catch(() => undefined);
      }

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

  useEffect(() => {
    if (currentStep !== 3 || username.trim()) return;
    const seed = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seed.length >= 3) setUsername(seed.slice(0, 24));
  }, [currentStep, firstName, lastName, username]);

  useEffect(() => {
    const value = username.trim().toLowerCase();
    if (currentStep !== 3) return;

    if (!value) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      setUsernameSuggestions([]);
      return;
    }

    if (value.length < 3) {
      setUsernameStatus("invalid");
      setUsernameMessage("Username must be at least 3 characters.");
      setUsernameSuggestions([]);
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");
    setUsernameMessage("Checking availability…");
    setUsernameSuggestions([]);

    const timeout = window.setTimeout(() => {
      checkUsernameRequest(value)
        .then((result) => {
          if (cancelled) return;
          setUsernameStatus(result.status);
          setUsernameMessage(result.message);
          setUsernameSuggestions(result.suggestions.slice(0, 3));
        })
        .catch(() => {
          if (cancelled) return;
          setUsernameStatus("invalid");
          setUsernameMessage("Unable to check this username right now.");
          setUsernameSuggestions([]);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [username, currentStep]);

  return (
    <CenteredAuthFrame
      contentClassName={currentStep === 6 ? "max-w-[512px]" : "max-w-[388px]"}
      pageClassName={currentStep === 6 ? "bg-[#F3F4F6]" : "bg-white"}
    >
      <AuthLogo />
      {currentStep < 6 ? <StepIndicator currentStep={currentStep} totalSteps={5} /> : null}

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
              <div className="relative">
                <input
                  type="text"
                  placeholder="alexpeterson"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setError("");
                    setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 24));
                  }}
                  className={`${authInputClass} pr-12 ${
                    usernameStatus === "available"
                      ? "border-green-500 focus:border-green-600 focus:ring-green-600"
                      : usernameStatus === "taken" || usernameStatus === "invalid"
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                        : ""
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking" ? (
                    <Loader2 size={18} className="animate-spin text-[#00696F]" />
                  ) : usernameStatus === "available" ? (
                    <Check size={18} className="text-green-600" />
                  ) : usernameStatus === "taken" || usernameStatus === "invalid" ? (
                    <X size={18} className="text-red-500" />
                  ) : null}
                </span>
              </div>
              <p
                className={`text-xs mt-1.5 ${
                  usernameStatus === "available"
                    ? "text-green-700"
                    : usernameStatus === "taken" || usernameStatus === "invalid"
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {usernameMessage || "You can change this later in settings."}
              </p>
              {usernameStatus === "taken" && usernameSuggestions.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-[#0B1C30] mb-2">Suggested usernames</p>
                  <div className="flex flex-wrap gap-2">
                    {usernameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setError("");
                          setUsername(suggestion);
                        }}
                        className="rounded-full border border-[#D3E4FE] bg-[#EFF4FF] px-3 py-1.5 text-[13px] font-semibold text-[#00696F] hover:bg-[#DCE9FF] transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
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
              <button
                type="button"
                onClick={goNext}
                disabled={usernameStatus === "checking" || usernameStatus !== "available"}
                className={`flex-1 ${primaryButtonClass}`}
              >
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
            Personalize your ChatTm experience.
          </p>
          <div className="w-full flex flex-col items-center gap-6">
            <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={handlePhoto} />
            <div className="flex flex-col items-center gap-2">
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
              <p className="text-xs text-[#6B7280]">JPG, GIF or PNG. Max size of 800K</p>
            </div>
            <div className="w-full">
              <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Bio (Optional)</label>
              <textarea
                placeholder="What do you do? Tell us about yourself"
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
              <button type="button" onClick={goNext} disabled={loading} className={`flex-1 ${primaryButtonClass}`}>
                Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 6 && (
        <div className="w-full rounded-[16px] bg-white/90 p-10 shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-white/20">
          <div className="w-full flex flex-col gap-5">
            <div>
              <label className="block text-[14px] font-medium text-[#0B1C30] mb-2">Select Document Type</label>
              <div className="relative">
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  className={`${authInputClass} appearance-none pr-10`}
                >
                  {DOCUMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              </div>
            </div>

            <div>
              <label className="block text-[14px] font-medium text-[#0B1C30] mb-2">Upload Photo</label>
              <input
                ref={documentInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(event) => handleDocumentFile(event.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => documentInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  handleDocumentFile(event.dataTransfer.files?.[0]);
                }}
                className={`w-full rounded-[12px] border border-dashed px-4 py-8 flex flex-col items-center text-center transition ${
                  dragActive ? "border-[#00696F] bg-[#E8F4F3]" : "border-[#D1D5DB] bg-white"
                }`}
              >
                {documentPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={documentPreview} alt="Document preview" className="mb-3 h-24 rounded-lg object-contain" />
                ) : (
                  <img src="/figma/icons/cloud-upload.svg" alt="" width={28} height={20} className="mb-3" />
                )}
                <p className="text-[15px] font-semibold text-[#0B1C30]">
                  {documentFile ? documentFile.name : "Click to upload or drag and drop"}
                </p>
                <p className="mt-1 text-[13px] text-[#6B7280]">SVG, PNG, JPG or WEBP (max. 10MB)</p>
                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                  <Info size={14} />
                  Ensure all text is clearly visible
                </p>
              </button>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              disabled={loading}
              onClick={() => void finishSignup("submit")}
              className={`${primaryButtonClass} w-full flex items-center justify-center gap-2`}
            >
              {loading ? "Submitting..." : "Submit for Verification"}
              {!loading ? <ArrowRight size={18} /> : null}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void finishSignup("skip")}
              className="text-[#38BDF8] font-medium hover:underline"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </CenteredAuthFrame>
  );
}
