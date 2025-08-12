export type UsersType = {
  id: string;
  name: string;
  role: string;
};

export type CustomersType = {
  id: string;
  name: string;
  contact: string;
  customerType: string;
};

export type ProductsType = {
  id: string;
  name: string;
  weight: string | null;
  unit: string | null;
  mrp: number | null;
  price: number;
};

export type ProductHistoryType = {
  id: string;
  name: string;
  weight: string;
  unit: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldMrp: number;
  newMrp: number;
};

export type SalesType = {
  id: string;
  invoiceNo: number;
  customerId: string;
  customerName: string;
  grandTotal: number;
  totalQuantity: number;
  isPaid: boolean;
};

export type SaleItemsType = {
  id: string;
  saleId: string;
  productId: string;
  name: string;
  mrp: number;
  price: number;
  weight: string;
  unit: string;
  quantity: number;
  totalPrice: number;
};

export type ApiResponse<T> =
  | {
      status: "success";
      data: T;
    }
  | {
      status: "error";
      error: {
        message: string;
        details?: any;
      };
    };

export interface SalePayload {
  invoiceNo: number;
  customerName: string;
  customerContact: string;
  grandTotal: number;
  totalQuantity: number;
  isPaid: boolean;
  items: (ProductsType & { quantity: number; totalPrice: number })[] | [];
}

export interface ProductsApi {
  getAllProducts: () => Promise<ApiResponse<ProductsType[]>>;
  search: (query: string, page: number, limit: number) => Promise<ApiResponse<ProductsType[]>>;
}

export interface BillingApi {
  getNextInvoiceNo: () => Promise<ApiResponse<number>>;
  save: (payload: SalePayload) => Promise<ApiResponse<string>>;
}
