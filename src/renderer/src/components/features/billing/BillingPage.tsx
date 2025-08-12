import BillingHeader from "./BillingHeader";
import BillPreview from "./BillPreview";
import LineItemsTable from "./LineItemsTable";

const BillingPage = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-full flex-1 flex-col overflow-y-auto">
          <BillingHeader />
          <LineItemsTable />
        </div>
        <BillPreview />
      </div>
    </div>
  );
};

export default BillingPage;
