import { db } from "../../db/db";
import { appInstance, storeProfile } from "../../db/schema";

const STORE_ID = "default";

export const seedAppInstanceAndStoreProfile = async () => {
  console.log("Starting seed of app instance and store profile...");

  try {
    const existingAppInstance = db.select().from(appInstance).get();
    if (!existingAppInstance) {
      db.insert(appInstance)
        .values({
          id: STORE_ID,
          os: "unknown",
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

    console.log("Seed completed successfully.");
  } catch (error) {
    console.error("Error seeding app instance and store profile:", error);
  }
};
