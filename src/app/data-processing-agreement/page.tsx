import { LegalPageFrame, LegalSection } from "@/components/legal-page-frame";

export default function DataProcessingAgreementPage() {
  return (
    <LegalPageFrame
      eyebrow="Legal"
      title="Data Processing Agreement"
      summary="This DPA describes how Novua Control processes customer operational data when acting on behalf of a workspace."
    >
      <LegalSection title="1. Roles">
        <p>
          The customer acts as controller for workspace data it submits or
          connects. Novua Control acts as processor for that data when providing
          the service.
        </p>
      </LegalSection>

      <LegalSection title="2. Processing purpose">
        <p>
          Processing is limited to ingesting source-system events, generating
          operational evidence, storing incident records, supporting audit logs,
          and enabling workspace users to manage release and incident workflows.
        </p>
      </LegalSection>

      <LegalSection title="3. Security measures">
        <p>
          Reasonable technical and organizational measures are used to protect
          workspace data, including authenticated access, workspace scoping, and
          restricted infrastructure access.
        </p>
      </LegalSection>

      <LegalSection title="4. Subprocessors">
        <p>
          Hosting, storage, billing, and integration vendors may be used where
          required to operate the service. Additional subprocessors may be
          introduced as the product evolves.
        </p>
      </LegalSection>

      <LegalSection title="5. Customer requests">
        <p>
          Requests related to deletion, export, or processing restrictions can
          be made by contacting{" "}
          <a className="underline underline-offset-4" href="mailto:iveteamorim@gmail.com">
            iveteamorim@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageFrame>
  );
}
