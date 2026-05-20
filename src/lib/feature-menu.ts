export type OptionalFeatureId =
  | "ai-ocr"
  | "ai-chat"
  | "business-cards"
  | "expense"
  | "knowledge";

export interface OptionalFeature {
  id: OptionalFeatureId;
  label: string;
  icon: string;
  path: string;
}

export const optionalFeatures: OptionalFeature[] = [
  { id: "ai-ocr", label: "AI-OCR", icon: "scan-text", path: "/settings/features#ai-ocr" },
  { id: "ai-chat", label: "AIチャット", icon: "message-circle", path: "/settings/features#ai-chat" },
  { id: "business-cards", label: "名刺管理", icon: "id-card", path: "/settings/features#business-cards" },
  { id: "expense", label: "経費精算管理", icon: "receipt", path: "/settings/features#expense" },
  { id: "knowledge", label: "社内ナレッジ", icon: "book-open", path: "/settings/features#knowledge" },
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
