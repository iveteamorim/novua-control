import { LegalPageFrame, LegalSection } from "@/components/legal-page-frame";

export default function PrivacyPage() {
  return (
    <LegalPageFrame
      eyebrow="Legal"
      title="Privacy Policy"
      summary="This policy explains what Novua Control stores, why it is processed, and how workspace-level operational data is handled."
    >
      <LegalSection title="1. Data collected">
        <p>
          Novua Control stores account details, workspace metadata, integration
          settings, incident state, audit entries, and operational artifacts
          needed to provide the service.
        </p>
      </LegalSection>

      <LegalSection title="2. Purpose of processing">
        <p>
          Data is processed to authenticate users, scope workspaces, connect
          source systems, generate operational signals, and maintain an audit
          trail of incident actions.
        </p>
      </LegalSection>

      <LegalSection title="3. Security and retention">
        <p>
          Access is restricted by account session and workspace boundaries.
          Records are retained for service delivery, auditability, support, and
          security review, subject to operational and legal needs.
        </p>
      </LegalSection>

      <LegalSection title="4. Third-party processors">
        <p>
          The service may use third-party infrastructure and integrations such
          as hosting, databases, billing, and source-system APIs to operate the
          product.
        </p>
      </LegalSection>

      <LegalSection title="5. Contact">
        <p>
          Privacy questions can be sent to{" "}
          <a className="underline underline-offset-4" href="mailto:iveteamorim@gmail.com">
            iveteamorim@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageFrame>
  );
}
