import { apiClient } from "@/lib/apiClient";
import { useBillingStore } from "@/store/billingStore";
import {
  BILLSTATUS,
  type TransactionType,
  type UpdateEstimateResponse,
  type UpdateSaleResponse
} from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

export type MutationVariables = {
  type: TransactionType;
  id: string | null;
  payload: any;
};

export const useAutoSaveSync = () => {
  const setStatus = useBillingStore((state) => state.setStatus);

  // save mutation
  const saveMutation = useMutation<
    { id: string } | UpdateSaleResponse | UpdateEstimateResponse,
    Error,
    MutationVariables
  >({
    mutationFn: ({ type, id, payload }) => {
      if (id) {
        return apiClient.post<UpdateSaleResponse>(`/api/${type}s/${id}/edit`, payload);
      } else {
        return apiClient.post<{ id: string }>(`/api/${type}s/create`, payload);
      }
    },
    onMutate: () => setStatus(BILLSTATUS.SAVING),
    onSuccess: (response, variables) => {
      setStatus(BILLSTATUS.SAVED);

      // for new TXN
      // if (!variables.id && response.id) {
      //   setBillingId(response.id);
      //   const newPath = `/billing/${variables.type}s/${response.id}/edit`;
      //   window.history.replaceState(window.history.state, "", `#${newPath}`);
      // }

      // Sync original values to prevent infinite loop
      // syncOriginals();

      // update internal ids (only present on update responses)
      // if ("items" in response && response.items) {
      //   setBillingDate(new Date(response.createdAt!));
      //   // updateInternalIds(response.items);
      // }
    },
    onError: (error) => {
      setStatus(BILLSTATUS.UNSAVED);
      toast.error(error.message);
    }
  });

  return {
    saveMutation
  };
};
