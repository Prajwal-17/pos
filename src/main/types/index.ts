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
  quantity: number;
  mrp: number;
  price: number;
};

export type SalesType = {
  id: string;
  customerId: string;
  customerName: string;
  total: number;
  totalQuantity: number;
};
