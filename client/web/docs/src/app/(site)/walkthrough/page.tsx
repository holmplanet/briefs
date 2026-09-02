import { CodeBlock } from "@/components/docs/code-block";
import { DocPageHeader, DocSection } from "@/components/docs/doc-section";

export default function WalkthroughPage() {
  return (
    <>
      <DocPageHeader
        eyebrow="Walkthrough"
        title="From a request to durable work"
        description="See the complete developer path: an assistant captures a follow-up, Briefs records it, and a client reads the item and its history."
      />

      <div className="space-y-12">
        <DocSection id="scenario" title="The scenario">
          <p>
            A user tells an assistant: “Follow up with the design team about the onboarding flow next Tuesday.”
            Your application wants that request to become durable work that can be reviewed in Daily or a custom
            interface.
          </p>
        </DocSection>

        <DocSection id="mcp-write" title="1. Capture through MCP">
          <p>
            The assistant calls the Briefs MCP adapter. It does not need to know how Postgres, actors, or activity
            records are stored.
          </p>
          <CodeBlock
            title="MCP tool call"
            code={"items_create({\n  \"name\": \"Follow up with the design team about onboarding\",\n  \"kind\": \"task\",\n  \"description\": \"Discuss the onboarding flow next Tuesday\",\n  \"status\": \"open\"\n})"}
          />
        </DocSection>

        <DocSection id="persist" title="2. Briefs persists the work">
          <p>
            The MCP tool calls the System API with the authenticated bearer token. The API validates the input against
            {" "}<code className="text-foreground">itemCreateInputSchema</code>, creates the Item, resolves the acting
            Actor, and appends an Activity in the same write path.
          </p>
          <CodeBlock
            title="Created item"
            code={"{\n  \"id\": \"item_123\",\n  \"name\": \"Follow up with the design team about onboarding\",\n  \"kind\": \"task\",\n  \"status\": \"open\",\n  \"ownerActorId\": \"actor_456\"\n}"}
          />
        </DocSection>

        <DocSection id="read" title="3. Read it from any client">
          <p>
            A web client can read the projection through REST and render it however its users need. Daily is the
            reference client, but a CRM, operations console, or internal tool can use the same endpoints.
          </p>
          <CodeBlock
            title="REST"
            code={"GET /api/v1/items/item_123\nAuthorization: Bearer <access-token>\n\nGET /api/v1/items/item_123/activities\nAuthorization: Bearer <access-token>"}
          />
        </DocSection>

        <DocSection id="build" title="4. Build on the contract">
          <p>
            A custom client can share the schemas and UI primitives, then own its presentation and workflows:
          </p>
          <CodeBlock
            title="Client imports"
            code={"import { itemSchema } from \"@briefs/shared/item\";\nimport { AppShell } from \"@briefs/web-shared\";\n\nconst item = itemSchema.parse(await response.json());"}
          />
          <p>
            The result is a client that can evolve independently without creating a second work model or losing the
            activity history created by assistants and services.
          </p>
        </DocSection>

        <DocSection id="next" title="Where to start">
          <p>
            Run the local stack with the <code className="text-foreground">Quickstart</code>, inspect the reference
            client in <code className="text-foreground">client/web/flight-spike</code>, then follow{" "}
            <code className="text-foreground">Build a client</code> to create your own interface.
          </p>
        </DocSection>
      </div>
    </>
  );
}
