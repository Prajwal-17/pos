const BillPreview = () => {
  return (
    <>
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
    </>
  );
};

export default BillPreview;
