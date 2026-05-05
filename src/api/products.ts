import { supabase } from "@/lib/supabase";
import { toNumber } from "@/lib/db";
import type { Product } from "@/types";

const TABLE = "products";
const BUCKET = "product-images";

function getImagePublicUrl(image_url: string | null | undefined): string | undefined {
  if (!image_url) return undefined;
  if (image_url.startsWith("http")) return image_url;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(image_url);
  return data.publicUrl;
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    price: toNumber(row.price),
    stock: (row.stock as number) ?? 0,
    barcode: row.barcode as string | undefined,
    image_url: getImagePublicUrl(row.image_url as string | null | undefined),
    category_id: row.category_id as string | undefined,
    category: (row as any).category
      ? {
          id: (row as any).category.id || "",
          name: (row as any).category.name,
          description: (row as any).category.description,
          color: (row as any).category.color,
        }
      : undefined,
    created_at: row.created_at as string | undefined,
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

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*, category:categories(id, name, description, color)")
    .order("name");

  if (error) throw error;
  return (data || []).map(mapProduct);
}

export async function createProduct(
  product: Omit<Product, "id" | "created_at" | "category">
): Promise<Product> {
  const payload: Record<string, unknown> = {};
  if (product.name !== undefined) payload.name = product.name;
  if (product.price !== undefined) payload.price = product.price;
  if (product.stock !== undefined) payload.stock = product.stock;
  if (product.barcode !== undefined) payload.barcode = product.barcode;
  if (product.image_url !== undefined) payload.image_url = product.image_url;
  if (product.category_id !== undefined) payload.category_id = product.category_id;

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
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

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
