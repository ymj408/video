export type JobStatus = "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
export type JobStage =
  | "QUEUED"
  | "VALIDATING"
  | "GENERATING"
  | "FINALIZING"
  | "COMPLETED"
  | "FAILED";

export interface DemoUser {
  id: string;
  displayName: string;
  email: string;
  avatarColor: string;
  planName: string;
  credits: number;
  createdAt?: string;
}

export interface TemplateCategory {
  slug: string;
  label: string;
  count: number;
}

export interface Template {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  coverUrl: string;
  requiredImageCount: number;
  acceptedMimeTypes: string[];
  maxFileSizeBytes: number;
  featured: boolean;
}

export interface UploadedAsset {
  id: string;
  originalFilename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface JobAsset {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface JobEvent {
  seq: number;
  stage: JobStage;
  status: JobStatus;
  message: string;
  createdAt: string;
}

export interface Job {
  id: string;
  templateId: string;
  templateTitle: string;
  templateCoverUrl: string;
  status: JobStatus;
  stage: JobStage;
  progress: number;
  assetCount: number;
  resultUrl?: string;
  failureStage?: JobStage;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  assets: JobAsset[];
  events?: JobEvent[];
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface SimulationState {
  controlEnabled: boolean;
  stepDelayMs: number;
  failStage: "NONE" | "VALIDATING" | "GENERATING" | "FINALIZING";
  failNextOnly: boolean;
  availableStages: string[];
}
