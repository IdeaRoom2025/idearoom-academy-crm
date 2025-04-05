// This script can be run to create the necessary storage bucket for reviews
// You can run this with Node.js

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: "./.env.local" }); // Load from .env.local which is where Next.js stores env vars

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Environment check:");
console.log("SUPABASE_URL present:", !!supabaseUrl);
console.log("SUPABASE_KEY present:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    // Try to create the review-images bucket
    const { data, error } = await supabase.storage.createBucket(
      "review-images",
      {
        public: true,
        fileSizeLimit: 2097152, // 2MB in bytes
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/gif",
          "image/webp",
        ],
      }
    );

    if (error) {
      // If bucket already exists, this is fine
      if (error.message.includes("already exists")) {
        console.log('Bucket "review-images" already exists');
      } else {
        throw error;
      }
    } else {
      console.log('Successfully created bucket "review-images"');
    }

    // Try to set up public policy for the bucket
    try {
      const { data: policyData, error: policyError } =
        await supabase.storage.updateBucket("review-images", {
          public: true,
        });

      if (policyError) {
        console.error("Error updating bucket policy:", policyError);
      } else {
        console.log('Successfully updated bucket policy for "review-images"');
      }
    } catch (policyErr) {
      console.error("Error setting bucket policy:", policyErr);
    }

    console.log("Storage setup completed successfully");
  } catch (err) {
    console.error("Error setting up storage:", err);
  }
}

setupStorage();
