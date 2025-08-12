import { ipcMain } from "electron/main";
import type { ApiResponse, ProductsType } from "../../shared/types";
import { products } from "../db/schema";
import { db } from "../db/db";
import { like } from "drizzle-orm";

export function productHandlers() {
  ipcMain.handle("productsApi:getAllProducts", async (): Promise<ApiResponse<ProductsType[]>> => {
    try {
      const allProducts = await db.select().from(products);
      return { status: "success", data: allProducts };
    } catch (error) {
      console.log(error);
      return { status: "error", error: { message: "Could not fetch Products" } };
    }
  });

  ipcMain.handle(
    "productsApi:search",
    async (
      _event,
      query: string,
      page: number,
      limit: number
    ): Promise<ApiResponse<ProductsType[]>> => {
      try {
        if (query === "") return { status: "success", data: [] };
        console.log(page, limit);
        const offset = (page - 1) * limit;
        const searchResult = await db
          .select()
          .from(products)
          .where(like(products.name, `%${query}%`))
          .limit(limit)
          .offset(offset);

        return { status: "success", data: searchResult };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not search Products" } };
      }
    }
  );
}
