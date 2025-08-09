import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

const BillPreview = () => {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const items = [
    { id: "item001", name: "Wireless Mouse", quantity: 2, price: 20.0, amount: 40.0 },
    { id: "item002", name: "Mechanical Keyboard", quantity: 1, price: 65.0, amount: 65.0 },
    { id: "item003", name: "HD Monitor", quantity: 3, price: 140.0, amount: 420.0 },
    { id: "item004", name: "USB-C Hub", quantity: 4, price: 35.0, amount: 140.0 },
    { id: "item005", name: "Laptop Stand", quantity: 2, price: 28.0, amount: 56.0 }
  ];

  const handlePrint = useReactToPrint({
    contentRef: receiptRef
  });

  function handleSave() {
    console.log("save");
  }

  return (
    <>
      <div className="flex w-1/4 flex-col items-center justify-between overflow-y-auto bg-neutral-100 py-7">
        <div ref={receiptRef} className="w-[320px] bg-white px-4 py-4 text-black">
          <div className="mb-2 space-y-2 py-4 text-center">
            <h1 className="text-lg font-bold tracking-tight">SRI MANJUNATHESHWARA STORES</h1>
            <p className="text-xs">6TH MAIN, RUKMINI NAGAR NAGASANDRA POST BANGALORE 560073</p>
            <p className="text-xs">
              <span className="font-semibold">GSTIN:</span>29BHBPR8333N2ZM
            </p>
            <p className="text-xs">
              <span className="font-semibold">Ph.No.:</span>
              9945029729
            </p>
          </div>
          <div className="mb-4 flex justify-between border-t border-b border-dashed border-black py-1 text-xs">
            <div>
              <div>
                <span className="font-semibold">Date:</span> 23/02/2025
              </div>
              <div>
                <span className="font-semibold">Invoice:</span> 355
              </div>
            </div>
            <div>
              <span className="font-semibold">Time:</span> 04:54pm
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-dashed border-black pb-1 text-xs font-bold">
            <div className="col-span-1">#</div>
            <div className="col-span-5">ITEM</div>
            <div className="col-span-2 text-center">QTY</div>
            <div className="col-span-2 text-right">RATE</div>
            <div className="col-span-2 text-right">AMT</div>
          </div>
          <div className="border-b border-dashed border-black text-xs">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 py-1">
                <div className="col-span-1">{idx + 1}</div>
                <div className="col-span-5">{item.name}</div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-2 text-right">{item.price.toFixed(2)}</div>
                <div className="col-span-2 text-right">{item.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="py-3 text-right">
            <span className="text-base font-semibold">Total: </span>
            <span className="text-lg font-semibold">₹3740.00</span>
          </div>
          <div className="py-4 text-center">*** You Saved ₹30 ***</div>
          <div className="text-center">Thank You</div>
        </div>
        <div className="flex w-1/4">
          <Button className="" onClick={handleSave}>
            Save
          </Button>
          <Button className="" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>
    </>
  );
};

export default BillPreview;
