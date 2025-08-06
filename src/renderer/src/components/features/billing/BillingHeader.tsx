import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBillingStore } from "@/store/billingStore";
import { Calendar, Check, Clock4, SquarePen, X } from "lucide-react";
import { useState } from "react";

const BillingHeader = () => {
  const invoiceNo = useBillingStore((state) => state.invoiceNo);
  const setInvoiceNo = useBillingStore((state) => state.setInvoiceNo);
  const customerName = useBillingStore((state) => state.customerName);
  const setCustomerName = useBillingStore((state) => state.setCustomerName);
  const customerContact = useBillingStore((state) => state.customerContact);
  const setCustomerContact = useBillingStore((state) => state.setCustomerContact);

  const [tempInvoice, setTempInvoice] = useState(invoiceNo);
  const [editInvoice, setEditInvoice] = useState(false);
  return (
    <>
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
    </>
  );
};

export default BillingHeader;
