export type UsersType = {
  id: string;
  name: string;
  role: string;
  password: string;
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
  mrp: number | null;
  price: number | null;
};

export type SalesType = {
  id: string;
  customerId: string;
  customerName: string;
  grandTotal: number;
  totalQuantity: number;
  isPaid: boolean;
};
