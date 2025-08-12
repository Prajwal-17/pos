import BillingHeader from "../../components/features/billing/BillingHeader";
import BillPreview from "../../components/features/billing/BillPreview";
import LineItemsTable from "../../components/features/billing/LineItemsTable";

const EstimatePage = () => {
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

export default EstimatePage;
