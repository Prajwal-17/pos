import { Button } from "@/components/ui/button";
import { useBillingStore } from "@/store/billingStore";

const SearchDropdown = () => {
  const addLineItem = useBillingStore((state) => state.addLineItem);

  return (
    <>
      <div className="grid w-full grid-cols-10 border bg-neutral-100">
        <div className="col-span-1"></div>
        <div className="col-span-2">
          <Button className="hover:cursor-pointer" onClick={addLineItem}>
            Add Row
          </Button>
        </div>
      </div>
    </>
  );
};

export default SearchDropdown;
