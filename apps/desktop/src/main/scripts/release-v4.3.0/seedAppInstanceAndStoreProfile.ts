import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { CustomerRole } from "../../db/enum";
import { db } from "../../db/db";
import { appInstance, appPreferences, customers, storeProfile } from "../../db/schema";
import type { AppConfig } from "../../../shared/types";

const STORE_ID = "default";

export const seedAppInstanceAndStoreProfile = async () => {
  console.log("Starting seed of app instance and store profile...");

  try {
    const existingAppInstance = db.select().from(appInstance).get();
    if (!existingAppInstance) {
      db.insert(appInstance)
        .values({
          id: STORE_ID,
          os: process.platform,
          installedAt: new Date().toISOString()
        })
        .run();
      console.log("Inserted app instance.");
    } else {
      console.log("App instance already exists, skipping.");
    }

    const existingStoreProfile = db.select().from(storeProfile).get();
    if (!existingStoreProfile) {
      db.insert(storeProfile)
        .values({
          id: STORE_ID,
          storeName: "My Store",
          ownerName: "Store Owner",
          phone: "0000000000",
          email: "owner@example.com",
          addressLine1: "Default Address",
          country: "IN",
          state: "Maharashtra",
          city: "Mumbai",
          pincode: "400001"
        })
        .run();
      console.log("Inserted store profile.");
    } else {
      console.log("Store profile already exists, skipping.");
    }

    const existingAppPreferences = db.select().from(appPreferences).get();
    if (!existingAppPreferences) {
      let defaultCustomer = db
        .select()
        .from(customers)
        .where(eq(customers.name, "DEFAULT"))
        .get();

      if (!defaultCustomer) {
        defaultCustomer = db.select().from(customers).limit(1).get();
      }

      if (!defaultCustomer) {
        const newCustomerId = uuidv4();
        db.insert(customers)
          .values({
            id: newCustomerId,
            storeId: STORE_ID,
            name: "DEFAULT",
            customerType: CustomerRole.CASH
          })
          .run();
        defaultCustomer = { id: newCustomerId } as typeof customers.$inferSelect;
        console.log("Created DEFAULT customer.");
      }

      const appConfig: AppConfig = {
        billing: {
          defaultCustomerId: defaultCustomer.id
        },
        exports: {
          askBeforeSavingPdf: true,
          defaultPdfLocation: "/Desktop",
          defaultExportFormat: "pdf"
        }
      };

      db.insert(appPreferences)
        .values({
          id: uuidv4(),
          storeId: STORE_ID,
          config: appConfig
        })
        .run();
      console.log("Inserted app preferences.");
    } else {
      console.log("App preferences already exists, skipping.");
    }

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Error seeding app instance and store profile:", error);
  }
};
