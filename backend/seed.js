const fs = require('fs');
const csv = require('csv-parser');

console.log("🔬 Running X-Ray on products.csv...");

let rowCount = 0;
fs.createReadStream('products.csv')
  .pipe(csv())
  .on('data', (row) => {
    if (rowCount === 0) {
        console.log("=========================================");
        console.log("🔍 EXACT HEADERS THE COMPUTER SEES:");
        console.log(Object.keys(row));
        console.log("-----------------------------------------");
        console.log("🔍 EXACT DATA THE COMPUTER SEES:");
        console.log(Object.values(row));
        console.log("=========================================");
        process.exit(); // Stop after printing the first row
    }
    rowCount++;
  })
  .on('error', (err) => {
      console.log("Error reading file:", err);
  });