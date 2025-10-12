import { parseNaturalLanguageQuery } from './queryParser';

// Test konkretnego zapytania
const testQuery = "szukam szybkiego smartfona do 1500zl";
const result = parseNaturalLanguageQuery(testQuery);

console.log("=== TEST QUERY ===");
console.log(`Input: "${testQuery}"`);
console.log(`Keywords: "${result.keywords}"`);
console.log(`Max Price: ${result.maxPrice}`);
console.log(`Category: ${result.category}`);

// Oczekiwany rezultat:
console.log("\n=== OCZEKIWANY REZULTAT ===");
console.log(`Keywords: "smartfona" (usuwa: szukam, szybkiego, do, 1500zl)`);
console.log(`Max Price: 1500`);
console.log(`Category: "Telefony"`);

// Parametry URL które zostaną wysłane:
const params = new URLSearchParams();
params.append('q', result.keywords || testQuery);
if (result.minPrice) params.append('MinCena', result.minPrice.toString());
if (result.maxPrice) params.append('MaxCena', result.maxPrice.toString());
if (result.category) params.append('Kategoria', result.category);

console.log(`\n=== URL API ===`);
console.log(`/api/wyszukiwarka?${params.toString()}`);