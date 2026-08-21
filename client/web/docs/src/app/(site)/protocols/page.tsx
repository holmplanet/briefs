import { DocPageHeader, DocSection, DocTable } from "@/components/docs/doc-section";

export default function ProtocolsPage() {
  return (
    <>
      <DocPageHeader
        eyebrow="Standards"
        title="Protocols and contracts"
        description="Briefs combines established interoperability and security protocols with domain schemas owned by this project."
      />

      <div className="space-y-12">
        <DocSection id="mcp" title="Model Context Protocol">
          <p>
            Briefs uses the Model Context Protocol (MCP) to expose authenticated tools to assistants. MCP is the
            connection layer: it lets a client discover and call tools such as{" "}
            <code className="text-foreground">items_create</code> and{" "}
            <code className="text-foreground">items_list_activities</code>.
          </p>
          <p>
            MCP does not define the Briefs work model. The meaning of an Item, Actor, or Activity belongs to Briefs and
            is shared by MCP tools, the REST API, Daily, and custom clients.
          </p>
          <a
            href="https://modelcontextprotocol.io/specification"
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 hover:text-blue-200"
          >
            Read the MCP specification
          </a>
        </DocSection>

        <DocSection id="oauth" title="OAuth 2.1 and PKCE">
          <p>
            Production access uses OAuth bearer tokens. Daily uses the authorization code flow with PKCE, and the
            System API validates the token before resolving the request to a user and actor.
          </p>
          <p>
            Briefs also supports email OTP through its OAuth issuer. The allowed-email policy is configured by the
            deployment; the client should treat the issuer as the authority for sign-in and identity.
          </p>
          <a
            href="https://www.rfc-editor.org/rfc/rfc7636"
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 hover:text-blue-200"
          >
            Read the PKCE specification
          </a>
        </DocSection>

        <DocSection id="schemas" title="Briefs domain schemas">
          <p>
            The Item, Actor, and Activity schemas are Briefs-owned contracts. They are implemented with Zod in{" "}
            <code className="text-foreground">@briefs/shared</code> and validated at the API boundary.
          </p>
          <DocTable>
            <thead className="border-b border-border/60 bg-card/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Contract</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground/90">
              {[
                ["Item", "Durable work projection with identity, status, lifecycle, and optional source identity."],
                ["Actor", "Person or service responsible for an action."],
                ["Activity", "Append-only record of a create, update, or other change."],
              ].map(([name, role]) => (
                <tr key={name}>
                  <td className="px-4 py-2.5 font-medium">{name}</td>
                  <td className="px-4 py-2.5">{role}</td>
                </tr>
              ))}
            </tbody>
          </DocTable>
          <p>
            Start with the <code className="text-foreground">@briefs/shared</code> exports when building a client.
            That keeps your UI and integrations aligned with the same contracts used by the System API.
          </p>
        </DocSection>
      </div>
    </>
  );
}
