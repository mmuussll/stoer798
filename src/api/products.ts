import { supabase, getCurrentUserId, isCurrentUserAdmin } from "@/lib/supabase";
import { toNumber, type RawRow } from "@/lib/db";
import type { Product } from "@/types";
import { checkProductLimit } from "@/lib/planLimits";

const TABLE = "products";
const BUCKET = "product-images";

function getImagePublicUrl(image_url: string | null | undefined): string | undefined {
  if (!image_url) return undefined;
  if (image_url.startsWith("http")) return image_url;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(image_url);
  return data.publicUrl;
}

function mapProduct(row: RawRow): Product {
  const cat = (row as RawRow).category as RawRow | undefined;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    price: toNumber(row.price),
    wholesale_price: row.wholesale_price != null ? toNumber(row.wholesale_price) : undefined,
    stock: toNumber(row.stock),
    barcode: row.barcode ? String(row.barcode) : undefined,
    image_url: getImagePublicUrl(row.image_url as string | null | undefined),
    description: row.description ? String(row.description) : undefined,
    unit: row.unit ? String(row.unit) : undefined,
    category_id: row.category_id ? String(row.category_id) : undefined,
    category: cat
      ? {
          id: String(cat.id ?? ""),
          name: String(cat.name ?? ""),
          description: cat.description ? String(cat.description) : undefined,
          color: String(cat.color ?? "#6B7280"),
        }
      : undefined,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  return fileName;
}

export async function deleteProductImage(image_url: string): Promise<void> {
  if (!image_url.startsWith("http")) {
    await supabase.storage.from(BUCKET).remove([image_url]);
  }
}

export async function fetchProducts(page?: number, limit?: number): Promise<Product[]> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let query = supabase
    .from(TABLE)
    .select("*, category:categories(id, name, description, color)")
    .order("name");
  if (!isAdmin) query = query.eq("user_id", userId);

  if (limit && page !== undefined) {
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function fetchProductsCount(): Promise<number> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let countQuery = supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  if (!isAdmin) countQuery = countQuery.eq("user_id", userId);
  const { count, error } = await countQuery;

  if (error) throw error;
  return count || 0;
}

export async function fetchProductsCountForUser(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count || 0;
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at" | "category">
): Promise<Product> {
  const userId = await getCurrentUserId();

  await checkProductLimit(userId);

  const payload: Record<string, unknown> = {
    name: product.name,
    price: product.price,
    stock: product.stock ?? 0,
    user_id: userId,
  };
  if (product.barcode) payload.barcode = product.barcode;
  if (product.image_url) payload.image_url = product.image_url;
  if (product.category_id) payload.category_id = product.category_id;
  if (product.wholesale_price != null) payload.wholesale_price = product.wholesale_price;
  if (product.description) payload.description = product.description;
  if (product.unit) payload.unit = product.unit;

  const { data: inserted, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from(TABLE)
    .select("*, category:categories(id, name, description, color)")
    .eq("id", inserted.id)
    .single();

  if (fetchError) throw fetchError;
  return mapProduct(data);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product> {
  const payload: Record<string, unknown> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.stock !== undefined) payload.stock = updates.stock;
  if (updates.barcode !== undefined) payload.barcode = updates.barcode;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url;
  if (updates.category_id !== undefined) payload.category_id = updates.category_id;
  if (updates.wholesale_price !== undefined) payload.wholesale_price = updates.wholesale_price;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.unit !== undefined) payload.unit = updates.unit;

  const { error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id);

  if (error) throw error;

  const { data, error: fetchError } = await supabase
    .from(TABLE)
    .select("*, category:categories(id, name, description, color)")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const [userId, isAdmin] = await Promise.all([getCurrentUserId(), isCurrentUserAdmin()]);
  let query = supabase.from(TABLE).delete().eq("id", id);
  if (!isAdmin) query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
}

export async function duplicateProduct(id: string): Promise<Product> {
  const { data: original, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const userId = await getCurrentUserId();
  await checkProductLimit(userId);

  const insertPayload: Record<string, unknown> = {
    name: `${(original as RawRow).name} (نسخة)`,
    price: toNumber((original as RawRow).price),
    stock: toNumber((original as RawRow).stock),
    barcode: (original as RawRow).barcode ?? null,
    image_url: (original as RawRow).image_url ?? null,
    category_id: (original as RawRow).category_id ?? null,
  };

  if ((original as RawRow).wholesale_price != null) insertPayload.wholesale_price = (original as RawRow).wholesale_price;
  if ((original as RawRow).description != null) insertPayload.description = (original as RawRow).description;
  if ((original as RawRow).unit != null) insertPayload.unit = (original as RawRow).unit;

  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError) throw insertError;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*, category:categories(id, name, description, color)")
    .eq("id", inserted.id)
    .single();

  if (error) throw error;
  return mapProduct(data);
}
