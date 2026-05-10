import { supabase } from "@/lib/supabase";
import type { Category } from "@/types";

const TABLE = "categories";

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("name");

  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    created_at: row.created_at,
  }));
}

export async function createCategory(
  category: Omit<Category, "id" | "created_at">
): Promise<Category> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: category.name,
      description: category.description,
      color: category.color,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    color: data.color,
    created_at: data.created_at,
  };
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.color !== undefined) payload.color = updates.color;

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    color: data.color,
    created_at: data.created_at,
  };
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
