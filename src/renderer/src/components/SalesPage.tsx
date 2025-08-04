import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Calendar, Check, Clock4, SquarePen, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const SalesPage = () => {
  const [invoiceNo, setInvoiceNo] = useState("177");
  const [tempInvoice, setTempInvoice] = useState(invoiceNo);
  const [editInvoice, setEditInvoice] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  return (
    <div className="min-h-screen w-full">
      <div className="flex h-full w-full">
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
          <div className="h-full w-full flex-1 px-10 py-5 text-lg">
            <Table>
              <TableCaption>A list of your recent invoices.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">#</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>QTY</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
            <div>
              <Table>
                <TableHeader>
                  <TableRow className="font-semibold">
                    <TableHead className="w-[100px]">Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">INV001</TableCell>
                    <TableCell>Paid</TableCell>
                    <TableCell>Credit Card</TableCell>
                    <TableCell className="text-right">$250.00</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
