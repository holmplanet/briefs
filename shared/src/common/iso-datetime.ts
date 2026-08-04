import { z } from "zod";

export const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "invalid ISO datetime" });
