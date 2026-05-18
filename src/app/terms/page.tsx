import { LegalPageFrame, LegalSection } from "@/components/legal-page-frame";

export default function TermsPage() {
  return (
    <LegalPageFrame
      eyebrow="Legal"
      title="Terms of Service"
      summary="These terms govern access to Novua Control, including private pilot use, workspace access, and operational workflow configuration."
    >
      <LegalSection title="1. Service scope">
        <p>
          Novua Control is software for release coordination, incident review,
          and operational signal processing. Access may be provided as a private
          pilot, managed onboarding, or other limited release while the product
          evolves.
        </p>
      </LegalSection>

      <LegalSection title="2. Account responsibilities">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity performed through your account and
          workspace.
        </p>
      </LegalSection>

      <LegalSection title="3. Acceptable use">
        <p>
          You may not misuse the service, interfere with its operation, attempt
          unauthorized access, or use Novua Control in violation of law or
          contractual obligations owed to third parties.
        </p>
      </LegalSection>

      <LegalSection title="4. Availability and changes">
        <p>
          Features may change as the product matures. We may update, suspend,
          or remove functionality, especially in pilot environments, in order to
          improve reliability and security.
        </p>
      </LegalSection>

      <LegalSection title="5. Data and confidentiality">
        <p>
          Operational metadata, integration settings, audit entries, and
          incident records are handled in accordance with the Privacy Policy and
          the Data Processing Agreement where applicable.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact">
        <p>
          For contractual or legal questions, contact{" "}
          <a className="underline underline-offset-4" href="mailto:iveteamorim@gmail.com">
            iveteamorim@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageFrame>
  );
}
