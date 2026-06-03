export type OptionalFeatureId =
  | "minutes"
  | "schedule"
  | "ai-ocr"
  | "tasks"
  | "estimates"
  | "customers"
  | "expense"
  | "ai-chat"
  | "projects"
  | "business-cards";

export interface OptionalFeature {
  id: OptionalFeatureId;
  label: string;
  icon: string;
  path: string;
}

export const optionalFeatures: OptionalFeature[] = [
  { id: "minutes", label: "音声議事録", icon: "mic", path: "/minutes" },
  // { id: "ai-ocr", label: "AI-OCR", icon: "scan-text", path: "/settings/features#ai-ocr" },
  { id: "tasks", label: "タスク管理", icon: "check", path: "/tasks" },
  // { id: "estimates", label: "見積書管理", icon: "file-text", path: "/settings/features#estimates" },
  { id: "customers", label: "企業管理", icon: "building", path: "/customers" },
  // { id: "expense", label: "経費精算", icon: "receipt", path: "/settings/features#expense" },
  // { id: "ai-chat", label: "AIチャット", icon: "message-circle", path: "/settings/features#ai-chat" },
  { id: "projects", label: "案件管理", icon: "folder", path: "/projects" },
  // { id: "business-cards", label: "名刺管理", icon: "id-card", path: "/settings/features#business-cards" },
];

export type OptionalFeatureFlags = Record<OptionalFeatureId, boolean>;

export const OPTIONAL_FEATURE_FLAGS_KEY = "show-nin-optional-feature-flags";
export const OPTIONAL_FEATURE_FLAGS_EVENT = "show-nin-optional-feature-flags-change";

export function getDefaultFeatureFlags(): OptionalFeatureFlags {
  return optionalFeatures.reduce((flags, feature) => {
    flags[feature.id] = false;
    return flags;
  }, {} as OptionalFeatureFlags);
}

export function loadFeatureFlags(): OptionalFeatureFlags {
  try {
    const stored = localStorage.getItem(OPTIONAL_FEATURE_FLAGS_KEY);
    if (!stored) return getDefaultFeatureFlags();
    return { ...getDefaultFeatureFlags(), ...JSON.parse(stored) };
  } catch {
    return getDefaultFeatureFlags();
  }
}

export function saveFeatureFlags(flags: OptionalFeatureFlags) {
  localStorage.setItem(OPTIONAL_FEATURE_FLAGS_KEY, JSON.stringify(flags));
  window.dispatchEvent(new Event(OPTIONAL_FEATURE_FLAGS_EVENT));
}
