import type { Brief } from "@/lib/types";

type BriefPanelProps = {
  brief: Brief | null;
};

export function BriefPanel({ brief }: BriefPanelProps) {
  if (!brief) {
    return <p className="muted">Generate a brief to see priorities.</p>;
  }

  return (
    <div className="brief-output">
      <p className="brief-greeting">{brief.greeting}</p>

      {brief.sections.map((section) => (
        <div key={section.id} className="brief-section">
          <h3>{section.title}</h3>
          <ul>
            {section.bullets.map((bullet) => (
              <li key={`${section.id}-${bullet.text}`}>{bullet.text}</li>
            ))}
          </ul>
        </div>
      ))}

      {brief.sections.length === 0 ? (
        brief.bullets.length > 0 ? (
          <ul>
            {brief.bullets.map((bullet) => (
              <li key={bullet.text}>{bullet.text}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nothing urgent right now.</p>
        )
      ) : null}
    </div>
  );
}
