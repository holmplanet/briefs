"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ItemCreateInput, ItemUpdateInput } from "@briefs/shared/item";
import { createItem, updateItem } from "@/lib/briefs-api";

export async function createItemAction(input: ItemCreateInput) {
  const item = await createItem(input);
  revalidatePath("/items");
  redirect(`/items/${item.id}`);
}

export async function updateItemStatusAction(itemId: string, input: ItemUpdateInput) {
  await updateItem(itemId, input);
  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
}
