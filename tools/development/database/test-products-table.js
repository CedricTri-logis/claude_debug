#!/usr/bin/env node

/**
 * Products Table Test Script
 *
 * This script tests the products table functionality including:
 * - Table structure validation
 * - Sample data verification
 * - RLS policy testing
 * - Basic CRUD operations
 */

import { createValidatedSupabaseClients } from "../../shared/supabase-client.js";

// Create Supabase clients with validation
const { admin: supabaseAdmin, anon: supabaseAnon } =
  createValidatedSupabaseClients();

/**
 * Test table structure and constraints
 */
async function testTableStructure() {
  console.log("\n🔍 Testing table structure...");

  try {
    // Try to query the table to verify it exists and get column info
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Error fetching table structure:", error.message);
      return false;
    }

    // Check if we got a result (table exists)
    if (data !== null) {
      console.log("✅ Table structure verified - products table exists");

      // List expected columns
      const expectedColumns = [
        "id (UUID)",
        "name (VARCHAR)",
        "description (TEXT)",
        "price (DECIMAL)",
        "stock_quantity (INTEGER)",
        "created_at (TIMESTAMP)",
        "updated_at (TIMESTAMP)",
      ];

      console.log("   Expected columns:");
      expectedColumns.forEach((col) => {
        console.log(`   - ${col}`);
      });

      // Verify columns exist by checking first row
      if (data.length > 0) {
        const actualColumns = Object.keys(data[0]);
        const missingColumns = [
          "id",
          "name",
          "description",
          "price",
          "stock_quantity",
          "created_at",
          "updated_at",
        ].filter((col) => !actualColumns.includes(col));

        if (missingColumns.length > 0) {
          console.error(`❌ Missing columns: ${missingColumns.join(", ")}`);
          return false;
        }
      }

      return true;
    } else {
      console.error("❌ Products table not found");
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing table structure:", error.message);
    return false;
  }
}

/**
 * Test sample data insertion and retrieval
 */
async function testSampleData() {
  console.log("\n📊 Testing sample data...");

  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .limit(5);

    if (error) {
      console.error("❌ Error fetching sample data:", error.message);
      return false;
    }

    console.log(`✅ Found ${data.length} sample products:`);
    data.forEach((product) => {
      console.log(
        `   - ${product.name}: $${product.price} (Stock: ${product.stock_quantity})`,
      );
    });

    return true;
  } catch (error) {
    console.error("❌ Error testing sample data:", error.message);
    return false;
  }
}

/**
 * Test Row Level Security policies
 */
async function testRLSPolicies() {
  console.log("\n🔒 Testing RLS policies...");

  try {
    // Test anonymous read access (should work with public read policy)
    const { data: anonData, error: anonError } = await supabaseAnon
      .from("products")
      .select("id, name, price")
      .limit(3);

    if (anonError) {
      console.error("❌ Anonymous read access failed:", anonError.message);
      return false;
    }

    console.log(
      `✅ Anonymous read access works: ${anonData.length} products retrieved`,
    );

    // Test anonymous insert (should fail)
    const { data: insertData, error: insertError } = await supabaseAnon
      .from("products")
      .insert({
        name: "Test Product",
        description: "This should fail",
        price: 99.99,
        stock_quantity: 10,
      });

    if (!insertError) {
      console.error("❌ Anonymous insert should have failed but succeeded");
      // Clean up the test data
      if (insertData && insertData.length > 0) {
        await supabaseAdmin
          .from("products")
          .delete()
          .eq("id", insertData[0].id);
      }
      return false;
    }

    console.log("✅ Anonymous insert properly blocked by RLS");

    return true;
  } catch (error) {
    console.error("❌ Error testing RLS policies:", error.message);
    return false;
  }
}

/**
 * Test basic CRUD operations with admin privileges
 */
async function testCRUDOperations() {
  console.log("\n✏️  Testing CRUD operations...");

  try {
    // Create a test product
    const { data: createData, error: createError } = await supabaseAdmin
      .from("products")
      .insert({
        name: "Test CRUD Product",
        description: "This is a test product for CRUD operations",
        price: 123.45,
        stock_quantity: 50,
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Create operation failed:", createError.message);
      return false;
    }

    console.log("✅ CREATE: Product created successfully");
    const testProductId = createData.id;

    // Read the product
    const { data: readData, error: readError } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", testProductId)
      .single();

    if (readError) {
      console.error("❌ Read operation failed:", readError.message);
      return false;
    }

    console.log("✅ READ: Product retrieved successfully");

    // Update the product
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        price: 99.99,
        stock_quantity: 25,
        description: "Updated test product description",
      })
      .eq("id", testProductId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Update operation failed:", updateError.message);
      return false;
    }

    console.log("✅ UPDATE: Product updated successfully");
    console.log(`   - Price changed: $123.45 → $${updateData.price}`);
    console.log(`   - Stock changed: 50 → ${updateData.stock_quantity}`);

    // Delete the test product
    const { error: deleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", testProductId);

    if (deleteError) {
      console.error("❌ Delete operation failed:", deleteError.message);
      return false;
    }

    console.log("✅ DELETE: Product deleted successfully");

    return true;
  } catch (error) {
    console.error("❌ Error testing CRUD operations:", error.message);
    return false;
  }
}

/**
 * Test price and stock constraints
 */
async function testConstraints() {
  console.log("\n🚫 Testing constraints...");

  try {
    // Test negative price constraint
    const { error: priceError } = await supabaseAdmin.from("products").insert({
      name: "Invalid Price Product",
      price: -10.0,
      stock_quantity: 10,
    });

    if (!priceError) {
      console.error("❌ Negative price constraint should have failed");
      return false;
    }

    console.log("✅ Negative price constraint working correctly");

    // Test negative stock constraint
    const { error: stockError } = await supabaseAdmin.from("products").insert({
      name: "Invalid Stock Product",
      price: 10.0,
      stock_quantity: -5,
    });

    if (!stockError) {
      console.error("❌ Negative stock constraint should have failed");
      return false;
    }

    console.log("✅ Negative stock constraint working correctly");

    return true;
  } catch (error) {
    console.error("❌ Error testing constraints:", error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log("🧪 Starting Products Table Tests");
  console.log("================================");

  const tests = [
    { name: "Table Structure", fn: testTableStructure },
    { name: "Sample Data", fn: testSampleData },
    { name: "RLS Policies", fn: testRLSPolicies },
    { name: "CRUD Operations", fn: testCRUDOperations },
    { name: "Constraints", fn: testConstraints },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log("\n📋 Test Results Summary");
  console.log("=======================");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);

  if (failed === 0) {
    console.log(
      "\n🎉 All tests passed! Your products table is working correctly.",
    );
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please review the error messages above.",
    );
    process.exit(1);
  }
}

// Run tests if this script is executed directly
runTests().catch(console.error);

export { runTests };
