import type { Activity, ActivityChange } from "@briefs/shared/activity";

import { formatDateTime } from "@/lib/format";

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

function ChangeRow({ change }: { change: ActivityChange }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-sm">
      <span className="font-medium">{change.field}</span>
      <span className="text-muted-foreground"> changed </span>
      <span className="text-muted-foreground">{formatChangeValue(change.before)}</span>
      <span className="text-muted-foreground"> → </span>
      <span>{formatChangeValue(change.after)}</span>
    </div>
  );
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activities recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {activities.map((activity) => (
        <li key={activity.id} className="glass-panel rounded-2xl p-4 sm:rounded-3xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="font-medium tracking-[-0.01em]">{activity.type}</p>
              {activity.summary ? (
                <p className="text-sm text-muted-foreground">{activity.summary}</p>
              ) : null}
            </div>
            <time
              className="rounded-full border border-border/60 bg-background/40 px-2.5 py-0.5 text-xs text-muted-foreground"
              dateTime={activity.occurredAt}
            >
              {formatDateTime(activity.occurredAt)}
            </time>
          </div>

          {activity.result?.created ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Created <span className="text-foreground">{activity.result.created.name}</span> (
              {activity.result.created.kind})
            </p>
          ) : null}

          {activity.result?.changes && activity.result.changes.length > 0 ? (
            <div className="mt-3 space-y-2">
              {activity.result.changes.map((change, index) => (
                <ChangeRow key={`${activity.id}-${change.field}-${index}`} change={change} />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
