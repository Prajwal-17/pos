import { useEffect, useState } from "react";
import { Calendar, Check, Clock4, GripVertical, SquarePen, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type ItemType = {
  id: string;
  name: string;
  quantity: number;
  mrp: number;
  price: number;
};

const BillingPage = () => {
  const [invoiceNo, setInvoiceNo] = useState("177");
  const [tempInvoice, setTempInvoice] = useState(invoiceNo);
  const [editInvoice, setEditInvoice] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [items, setItems] = useState<ItemType[]>([]);
  const [searchParam, setSearchParam] = useState<string>("");
  const [searchRow, setSearchRow] = useState<number>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await window.productsApi.getAllProducts();

        console.log(response);
        setItems(response);
      } catch (error) {
        console.log(error);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await window.productsApi.search(searchParam);
        console.log(response);
      } catch (error) {
        console.log("error", error);
      }
    }
    fetchProducts();
  }, [searchParam]);

  return (
    <div className="min-h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-1 flex-col">
          <div className="border-b-border flex w-full flex-col justify-center gap-10 border px-4 py-5">
            <div className="flex items-center justify-between gap-5 px-2 py-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-muted-foreground text-base font-medium">Invoice Number</span>
                <span className="text-bold text-primary text-3xl font-semibold">#</span>
                {editInvoice ? (
                  <>
                    <Input
                      className="text-primary w-24 px-1 py-1 text-center !text-xl font-extrabold"
                      value={tempInvoice}
                      onChange={(e) => setTempInvoice(e.target.value)}
                    />
                    <Check
                      onClick={() => {
                        setEditInvoice(false);
                        setInvoiceNo(tempInvoice);
                      }}
                      className="cursor-pointer rounded-md p-1 text-green-600 hover:bg-neutral-200"
                      size={30}
                    />
                    <X
                      className="cursor-pointer rounded-md p-1 text-red-500 hover:bg-neutral-200"
                      onClick={() => {
                        setTempInvoice(invoiceNo);
                        setEditInvoice(false);
                      }}
                      size={30}
                    />
                  </>
                ) : (
                  <span className="text-primary text-3xl font-extrabold">{invoiceNo}</span>
                )}
                <SquarePen size={20} onClick={() => setEditInvoice(true)} />
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center">
                  <Calendar />
                  <span>17/04/2025</span>
                </div>
                <div className="flex items-center">
                  <Clock4 />
                  <span>17:53</span>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex w-full flex-1 items-center gap-4">
                <div className="w-full">
                  <span>Customer Name</span>
                  <Input
                    placeholder="Enter Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="w-full">
                  <span>Customer Phone Number</span>
                  <Input
                    placeholder="Enter Name"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 px-4">
                <Button>Cash</Button>
                <Button>Credit</Button>
              </div>
            </div>
          </div>
          <div className="h-full w-full flex-1 overflow-auto">
            <div className="w-full space-y-0 py-5">
              <div className="text-accent-foreground border-border grid grid-cols-10 items-center border bg-gray-100 text-base font-semibold">
                <div className="col-span-1 border-r border-gray-300 py-2 text-center">#</div>
                <div className="col-span-3 border-r border-gray-300 px-2 py-2 text-left">ITEM</div>
                <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">QTY</div>
                <div className="col-span-2 border-r border-gray-300 px-2 py-2 text-left">PRICE</div>
                <div className="col-span-2 px-2 py-2 text-left">AMOUNT</div>
              </div>

              {/*<div className="relative w-full space-y-1 py-3">
                {items.map((item, idx) => (
                  <div key={idx} className="group grid grid-cols-10 border bg-neutral-100">
                    <div className="col-span-1 h-full w-full border-r bg-white">
                      <div className="flex h-full w-full items-center justify-between gap-2 px-4">
                        <GripVertical
                          className="invisible px-1 py-1 group-hover:visible hover:cursor-grab hover:bg-neutral-100"
                          size={33}
                        />
                        <span className="text-xl">{idx + 1}</span>
                        <Trash2
                          className="text-destructive invisible rounded-md px-1 py-1 group-hover:visible hover:scale-103 hover:cursor-pointer hover:bg-neutral-100 active:scale-98"
                          size={33}
                        />
                      </div>
                    </div>
                    <div className="col-span-3 border-r px-1 py-1">
                      <input
                        value={item.name}
                        className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-lg font-bold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                        onClick={() => {
                          setSearchRow(idx + 1);
                          setIsDropdownOpen(true);
                        }}
                      />
                    </div>
                    <div className="col-span-2 border-r px-1 py-1">
                      <input
                        value={1}
                        className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-base font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                        onClick={() => {
                          setSearchRow(idx + 1);
                          setIsDropdownOpen(true);
                        }}
                      />
                    </div>
                    <div className="col-span-2 border-r px-1 py-1">
                      <input
                        value={item.price}
                        className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-base font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                        onClick={() => {
                          setSearchRow(idx + 1);
                          setIsDropdownOpen(true);
                        }}
                      />
                    </div>
                    <div className="col-span-2 border-r px-1 py-1">
                      <input
                        value={item.quantity}
                        className="focus:border-ring focus:ring-ring w-full rounded-lg border bg-white px-2 py-2 text-base font-semibold shadow-sm transition-all focus:ring-2 focus:ring-offset-0 focus:outline-none"
                        onClick={() => {
                          setSearchRow(idx + 1);
                          setIsDropdownOpen(true);
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="h-80"></div>
              </div>*/}
            </div>
          </div>
        </div>
        <div className="border-border h-full w-1/4 border">
          <div className="my-8 px-5">
            <div className="space-y-3">
              <div className="text-center text-xl font-bold">SRI MANJUNATHESHWARA STORES</div>
              <div className="text-center text-sm font-medium">
                6TH MAIN, RUKMINI NAGAR NAGASANDRA POST BANGALORE
              </div>
              <div className="text-center">Ph.No.: 9945029729</div>
            </div>
            <div className="border-b-border my-4 flex items-start justify-between border border-r-0 border-l-0 border-dotted px-3 py-6">
              <div>Cash Sales</div>
              <div>
                <div>Date: 18-03-2025</div>
                <div>Time: 04:56</div>
                <div>Invoice: 455</div>
              </div>
            </div>
            <div>Table</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
