export function formatToolResult(data: unknown, error?: unknown) {
  if (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);

    return {
      content: [{ type: "text" as const, text: message }],
      structuredContent: { data: null, error: message },
      isError: true,
    };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: { data, error: null },
  };
}
