export type SourceSystem = "github" | "vercel" | "linear";

export type IncidentState =
  | "detected"
  | "triaged"
  | "assigned"
  | "mitigating"
  | "resolved"
  | "reopened";

export type ArtifactType =
  | "pull_request"
  | "deployment"
  | "ticket"
  | "feature_flag"
  | "service";

export type ArtifactStatus =
  | "blocked"
  | "waiting_review"
  | "failed"
  | "in_progress"
  | "healthy"
  | "queued";

export type ControlArtifact = {
  id: string;
  label: string;
  type: ArtifactType;
  source: SourceSystem;
  service: string;
  owner: string | null;
  status: ArtifactStatus;
  updatedAt: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
};

export type DependencyEdge = {
  fromId: string;
  toId: string;
  relationship: string;
};

export type ControlEvent = {
  id: string;
  source: SourceSystem;
  artifactId: string;
  kind: string;
  at: string;
  summary: string;
  actor: string;
};

export type ControlSignal = {
  id: string;
  source: SourceSystem;
  artifactId: string;
  artifactType: ArtifactType;
  kind: string;
  title: string;
  status: ArtifactStatus;
  owner: string | null;
  occurredAt: string;
  summary: string;
  actor: string;
  metadata?: Record<string, string | number | boolean>;
};

export type ConnectorMode = "seed" | "live";

export type SourceBundle = {
  source: SourceSystem;
  mode: ConnectorMode;
  artifacts: ControlArtifact[];
  events: ControlEvent[];
  signals: ControlSignal[];
};

export type PolicyRule = {
  id: string;
  title: string;
  points: number;
  description: string;
};

export type RuleEvaluation = {
  rule: PolicyRule;
  evidence: string;
};

export type AlertSeed = {
  id: string;
  title: string;
  summary: string;
  recommendedAction: string;
  owner: string | null;
  artifactIds: string[];
  state: IncidentState;
  triggeredRuleIds: string[];
};

export type DecisionAlert = AlertSeed & {
  severity: "critical" | "high" | "medium";
  riskScore: number;
  artifacts: ControlArtifact[];
  rules: RuleEvaluation[];
};

export type AuditEntry = {
  id: string;
  alertId: string | null;
  at: string;
  actor: string;
  action: string;
  details: string;
  beforeState?: IncidentState;
  afterState?: IncidentState;
  reason?: string;
};

export type IncidentTransition = {
  id: string;
  alertId: string;
  at: string;
  actor: string;
  fromState: IncidentState;
  toState: IncidentState;
  reason: string;
};

export type SourceOverview = {
  source: SourceSystem;
  mode: ConnectorMode;
  artifacts: number;
  events: number;
  signals: number;
};

export type ControlDataset = {
  artifacts: ControlArtifact[];
  dependencies: DependencyEdge[];
  events: ControlEvent[];
  signals: ControlSignal[];
  policyRules: PolicyRule[];
  alertSeeds: AlertSeed[];
  auditTrail: AuditEntry[];
  incidentTransitions?: IncidentTransition[];
  sourceModes?: Partial<Record<SourceSystem, ConnectorMode>>;
};

export type PersistedIngestionRecord = {
  id: string;
  source: SourceSystem;
  eventType: string;
  receivedAt: string;
  artifacts: ControlArtifact[];
  events: ControlEvent[];
  signals: ControlSignal[];
};

export type PersistedIncidentRecord = {
  alertId: string;
  state: IncidentState;
  owner: string | null;
  updatedAt: string;
  transitions: IncidentTransition[];
};

export type ControlStore = {
  ingestions: PersistedIngestionRecord[];
  incidents: PersistedIncidentRecord[];
  auditTrail: AuditEntry[];
};

export type DashboardSnapshot = {
  alerts: DecisionAlert[];
  primaryAlert: DecisionAlert;
  blockedArtifacts: ControlArtifact[];
  unownedArtifacts: ControlArtifact[];
  servicesAtRisk: string[];
  meanDecisionDelayHours: number;
};
