export const ADS_KEY = "chattm-ads";
export const AD_DRAFT_KEY = "chattm-ad-draft";
export const AD_STEP_KEY = "chattm-ad-step";

export type AdStatus = "active" | "paused";
export type AdGoal = "engagement" | "profile" | "website";
export type EngagementRefine = "post" | "page" | "event";
export type ProfileDest = "profile" | "page";
export type Gender = "male" | "female" | "all";
export type DurationOption = 3 | 7 | 14 | "custom";

export type AdMetrics = {
  likes: number;
  comments: number;
  shares: number;
  leads: number;
  reach: number;
  spend: number;
  impressions: number;
  ctr: number;
  cpc: number;
  frequency: number;
};

export type AdCampaign = {
  id: string;
  title: string;
  body: string;
  image: string;
  status: AdStatus;
  startDate: string;
  endDate: string;
  goal: AdGoal;
  audienceLabel: string;
  locationLabel: string;
  interestsLabel: string;
  metrics: AdMetrics;
};

export type AdDraft = {
  editingId?: string;
  goal: AdGoal;
  engagementRefine: EngagementRefine;
  profileDest: ProfileDest;
  websiteUrl: string;
  cta: string;
  gender: Gender;
  ageMin: number;
  ageMax: number;
  interests: string[];
  locations: string[];
  radiusKm: number;
  dailyBudget: number;
  duration: DurationOption;
  customDays: number;
};

export const AD_SHOPPING_IMAGE =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=640&q=80";
export const AD_OFFICE_IMAGE =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80";
export const AD_WEBSITE_IMAGE =
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80";

const SAMPLE_METRICS: AdMetrics = {
  likes: 1245,
  comments: 320,
  shares: 185,
  leads: 248,
  reach: 48750,
  spend: 14530,
  impressions: 62340,
  ctr: 2.45,
  cpc: 1.25,
  frequency: 1.85,
};

export const DEFAULT_ADS: AdCampaign[] = [
  {
    id: "summer-sale-1",
    title: "Summer Sale is Live!",
    body: "Get up to 50% off on all fashion items. Limited time offer. Shop now and grab the best deals!",
    image: AD_SHOPPING_IMAGE,
    status: "active",
    startDate: "15 May 2025",
    endDate: "22 May 2025",
    goal: "website",
    audienceLabel: "Women, 18–35",
    locationLabel: "India (Top Cities)",
    interestsLabel: "Fashion, Shopping, Lifestyle",
    metrics: SAMPLE_METRICS,
  },
  {
    id: "summer-sale-2",
    title: "Summer Sale is Live!",
    body: "Get up to 50% off on all fashion items. Limited time offer. Shop now and grab the best deals!",
    image: AD_SHOPPING_IMAGE,
    status: "active",
    startDate: "15 May 2025",
    endDate: "22 May 2025",
    goal: "website",
    audienceLabel: "Women, 18–35",
    locationLabel: "India (Top Cities)",
    interestsLabel: "Fashion, Shopping, Lifestyle",
    metrics: SAMPLE_METRICS,
  },
  {
    id: "summer-sale-3",
    title: "Summer Sale is Live!",
    body: "Get up to 50% off on all fashion items. Limited time offer. Shop now and grab the best deals!",
    image: AD_SHOPPING_IMAGE,
    status: "active",
    startDate: "15 May 2025",
    endDate: "22 May 2025",
    goal: "website",
    audienceLabel: "Women, 18–35",
    locationLabel: "India (Top Cities)",
    interestsLabel: "Fashion, Shopping, Lifestyle",
    metrics: SAMPLE_METRICS,
  },
];

export const EMPTY_DRAFT: AdDraft = {
  goal: "engagement",
  engagementRefine: "post",
  profileDest: "profile",
  websiteUrl: "https://www.yourwebsite.com",
  cta: "Learn More",
  gender: "all",
  ageMin: 18,
  ageMax: 45,
  interests: ["Social Media", "Small Business", "E-commerce"],
  locations: ["San Francisco, CA", "New York, NY"],
  radiusKm: 20,
  dailyBudget: 1500,
  duration: 7,
  customDays: 10,
};

export type CreateStep = "goal" | "refine" | "audience" | "location" | "budget" | "review";

export function formatInr(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCount(value: number) {
  return value.toLocaleString("en-IN");
}

export function durationDays(draft: AdDraft) {
  return draft.duration === "custom" ? draft.customDays : draft.duration;
}

export function totalBudget(draft: AdDraft) {
  return draft.dailyBudget * durationDays(draft);
}

export function goalLabel(draft: AdDraft) {
  if (draft.goal === "engagement") {
    if (draft.engagementRefine === "page") return "More Page Likes";
    if (draft.engagementRefine === "event") return "More Event Responses";
    return "More Engagement";
  }
  if (draft.goal === "profile") {
    return draft.profileDest === "page" ? "More Business Page Visits" : "More Profile Visits";
  }
  return "More Website Visitors";
}

export function defaultCta(goal: AdGoal) {
  if (goal === "engagement") return "Learn More";
  if (goal === "profile") return "Visit Profile";
  return "Learn More";
}

export function audienceLabel(draft: AdDraft) {
  const gender =
    draft.gender === "male" ? "Men" : draft.gender === "female" ? "Women" : "All";
  return `${gender}, ${draft.ageMin}–${draft.ageMax}`;
}

export function locationLabel(draft: AdDraft) {
  return draft.locations.length ? draft.locations.join(", ") : "All locations";
}

export function interestsLabel(draft: AdDraft) {
  return draft.interests.length ? draft.interests.join(", ") : "General";
}

export function campaignImage(draft: AdDraft) {
  if (draft.goal === "website") return AD_WEBSITE_IMAGE;
  if (draft.goal === "profile") return AD_OFFICE_IMAGE;
  return AD_OFFICE_IMAGE;
}

export function campaignCopy(draft: AdDraft) {
  if (draft.goal === "website") {
    return {
      title: "Discover Collaborative Synergy",
      body: "Boost your digital presence with our new collaborative tools. Designed for modern teams to value both productivity and expression.",
    };
  }
  if (draft.goal === "profile") {
    return {
      title: "Visit our profile",
      body: "Elevate your team's workflow with our new integrated features. Check out our profile to see how modern teams get more done.",
    };
  }
  return {
    title: "Summer Sale is Live!",
    body: "Elevate your team's workflow with our new integrated features. #ChatTm #Productivity",
  };
}

export function endDateLabel(days: number) {
  const end = new Date();
  end.setDate(end.getDate() + days);
  return end.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function startDateLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function readAds(): AdCampaign[] {
  if (typeof window === "undefined") return DEFAULT_ADS;
  const raw = sessionStorage.getItem(ADS_KEY);
  if (!raw) return DEFAULT_ADS;
  try {
    const parsed = JSON.parse(raw) as AdCampaign[];
    return Array.isArray(parsed) ? parsed : DEFAULT_ADS;
  } catch {
    return DEFAULT_ADS;
  }
}

export function writeAds(ads: AdCampaign[]) {
  sessionStorage.setItem(ADS_KEY, JSON.stringify(ads));
}

export function readDraft(): AdDraft {
  if (typeof window === "undefined") return { ...EMPTY_DRAFT };
  const raw = sessionStorage.getItem(AD_DRAFT_KEY);
  if (!raw) return { ...EMPTY_DRAFT };
  try {
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as AdDraft) };
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export function writeDraft(patch: Partial<AdDraft>) {
  sessionStorage.setItem(AD_DRAFT_KEY, JSON.stringify({ ...readDraft(), ...patch }));
}

export function resetDraft() {
  sessionStorage.setItem(AD_DRAFT_KEY, JSON.stringify({ ...EMPTY_DRAFT }));
}

export function draftFromCampaign(ad: AdCampaign): AdDraft {
  return {
    ...EMPTY_DRAFT,
    editingId: ad.id,
    goal: ad.goal,
    cta: defaultCta(ad.goal),
  };
}

export function readStep(): CreateStep {
  if (typeof window === "undefined") return "goal";
  const raw = sessionStorage.getItem(AD_STEP_KEY);
  const steps: CreateStep[] = ["goal", "refine", "audience", "location", "budget", "review"];
  return steps.includes(raw as CreateStep) ? (raw as CreateStep) : "goal";
}

export function writeStep(step: CreateStep) {
  sessionStorage.setItem(AD_STEP_KEY, step);
}
