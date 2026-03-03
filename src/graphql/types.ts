import type { ToastType } from "../contexts/Toast/ToastProvider";

// Mock types for Apollo

// Identity related types
export type IdentityType = "Company" | "Individual";

export type IdentityStatus = "Active" | "Inactive";

export type IdentityRecord = {
  __typename?: "Identity";
  id: string;
  workspaceId: string;
  name: string;
  type: IdentityType;
  status: IdentityStatus;
  avatarUrl?: string;

  // Optional metadata (keep minimal)
  industry?: string;
  country?: string;
  companyId?: string;
  personKey?: string;
  createdAt: string;
};

export type Identity = {
  __typename?: "Identity";
  id: string;
  workspaceId: string;
  name: string;
  type: IdentityType;
  status: IdentityStatus;
  avatarUrl?: string;

  // Optional metadata (keep minimal)
  industry?: string;
  country?: string;
  company?: Identity;
  personKey?: string;
  createdAt: string;
};

export type IdentityFilters = {
  status?: string[];
  type?: string[];
  identityId?: string;
  searchText?: string;
  companyId?: string;
}

export type IdentitySort = "name" | "interactions" | "active" | "recent";




// Interaction related types
export type InteractionPartyRecord = {
  identityId: string;
  role: InteractionRole;
};

export type InteractionParty = {
  role: InteractionRole;
  identity: Identity;
};

export type InteractionsSort = "recent" | "oldest" | "created";

export type InteractionType = "PROPOSAL" |
  "CONTRACT" |
  "POLICY_UPDATE" |
  "VENDOR_ONBOARDING";

export type InteractionFilters = {
  status?: string[];
  identityId?: string;
  interactionId?: string;
  searchText?: string;
  parties?: string[];
  startDate?: string;
  endDate?: string;
  type?: string[];
};

export type ProposalData = {
  summary: string;
  amount: number;
  currency: "USD";
  effectiveDate: string;
  expirationDate?: string;
};

export type ContractData = {
  summary: string;
  contractValue: number;
  termLengthMonths: number;
  autoRenew: boolean;
};

export type PolicyUpdateData = {
  summary: string;
  policyArea: "Security" | "Compliance" | "HR";
  effectiveDate: string;
  impactLevel: "Low" | "Medium" | "High";
};

export type VendorOnboardingData = {
  summary: string;
  vendorType: "Logistics" | "Software" | "Consulting";
  riskLevel: "Low" | "Medium" | "High";
  onboardingChecklistComplete: boolean;
};

export type InteractionDataRecord = ProposalData |
  ContractData |
  PolicyUpdateData |
  VendorOnboardingData;

export type InteractionRecord = {
  id: string;
  workspaceId: string;
  title: string;
  status: InteractionState;
  type: InteractionType;
  data: InteractionDataRecord;
  parties: InteractionPartyRecord[];
  currentReviewerId?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
};

export type Interaction = {
  __typename?: "Interaction";
  id: string;
  workspaceId: string;
  title: string;
  status: InteractionState;
  type: InteractionType;
  data: InteractionDataRecord;
  parties: InteractionParty[];
  currentReviewer: Identity | null;
  creator: Identity;
  createdAt: string;
  updatedAt: string;
  description?: string;
  notifications?: ToastNotification[]; 
};

export const interactionRoleValues = ["Buyer", "Seller", "Partner"];
export type InteractionRole = (typeof interactionRoleValues)[number];

export const interactionStateValues = ["DRAFT", "IN_REVIEW", "APPROVED", "REJECTED"];
export type InteractionState = typeof interactionStateValues[number];

export const interactionActionValues = ["SUBMIT", "APPROVE", "REJECT", "RESUBMIT"];
export type InteractionAction = typeof interactionActionValues[number];




// Activity related types
export type InteractionActivityType = "INTERACTION_CREATED" | "STATUS_CHANGED" | "REVIEWER_ASSIGNED" | "COMMENT_ADDED" | "INTERACTION_DECIDED";

export type InteractionActivityMetadataRecord = InteractionActivityMetadata_Status |
  InteractionActivityMetadataRecord_Reviewer |
  InteractionActivityMetadata_Comment |
  InteractionActivityMetadata_Created |
  InteractionActivityMetadataRecord_Decision;

export type InteractionActivityMetadata = InteractionActivityMetadata_Status |
  InteractionActivityMetadata_Reviewer |
  InteractionActivityMetadata_Comment |
  InteractionActivityMetadata_Created |
  InteractionActivityMetadata_Decision;

export type InteractionActivityMetadata_Status = {
  __typename?: "InteractionActivityMetadata_Status";
  previousStatus: InteractionState;
  newStatus: InteractionState;
};

export type InteractionActivityMetadata_Reviewer = {
  __typename?: "InteractionActivityMetadata_Reviewer";
  nextReviewer: InteractionParty;
};

export type InteractionActivityMetadataRecord_Reviewer = {
  __typename?: "InteractionActivityMetadataRecord_Reviewer";
  nextReviewer: InteractionPartyRecord;
};

export type InteractionActivityMetadata_Comment = {
  __typename?: "InteractionActivityMetadata_Comment";
  commentExcerpt: string;
};

export type InteractionActivityMetadata_Created = {
  __typename?: "InteractionActivityMetadata_Created";
};

export type InteractionActivityMetadata_Decision = {
  __typename?: "InteractionActivityMetadata_Decision";
  finalStatus: InteractionState;
  decisionMaker: Identity;
};

export type InteractionActivityMetadataRecord_Decision = {
  __typename?: "InteractionActivityMetadataRecord_Decision";
  finalStatus: InteractionState;
  decisionMakerId: string;
};

export type InteractionActivityRecord = {
  __typename?: "InteractionActivityRecord";
  id: string;
  workspaceId: string;
  interactionId: string;
  interactionTitle: string;
  type: InteractionActivityType;
  occurredAt: string;
  actorId: string;
  metadata: InteractionActivityMetadataRecord;
};

export type InteractionActivity = {
  __typename?: "InteractionActivity";
  id: string;
  workspaceId: string;
  interactionId: string;
  interactionTitle: string;
  type: InteractionActivityType;
  occurredAt: string;
  actor: Identity;
  metadata: InteractionActivityMetadata;
};




// Search related types
export type SearchResult = Interaction | Identity;

export type SearchResponse = {
  results: SearchResult[];
  pageInfo: PageInfo;
};




// Workflow related types
type WorkflowConfig = {
  [K in InteractionState]: {
    allowedActions: InteractionAction[];
  };
};

export const WORKFLOW: WorkflowConfig = {
  DRAFT: {
    allowedActions: ["SUBMIT"],
  },
  IN_REVIEW: {
    allowedActions: ["APPROVE", "REJECT"],
  },
  APPROVED: {
    allowedActions: [],
  },
  REJECTED: {
    allowedActions: ["RESUBMIT"],
  },
};

export const ACTION_TO_STATUS: Record<InteractionAction, InteractionState> = {
  SUBMIT: "IN_REVIEW",
  APPROVE: "APPROVED",
  REJECT: "REJECTED",
  RESUBMIT: "IN_REVIEW",
};

export type ToastNotification = {
  __typename?: "ToastNotification";
  message: string;
  type: ToastType;
}





export type Workspace = {
  id: string;
  name: string;
};

export type PageInfo = {
  hasMore: boolean;
  total: number;
};










