/**
 * Generates a simple placeholder icon PNG using canvas.
 * Run: node scripts/generate-icon.js
 * Requires: npm install canvas
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#0C0C0C";
ctx.beginPath();
ctx.roundRect(0, 0, size, size, size * 0.22);
ctx.fill();

// Lime accent circle
ctx.fillStyle = "#B4FF39";
ctx.beginPath();
ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2);
ctx.fill();

// Printer icon (simplified)
ctx.fillStyle = "#050505";
const pw = size * 0.35, ph = size * 0.1;
const px = (size - pw) / 2, py = size / 2 - ph / 2 - size * 0.08;
ctx.beginPath();
ctx.roundRect(px, py, pw, ph, 6);
ctx.fill();

ctx.fillStyle = "#050505";
const pw2 = size * 0.25, ph2 = size * 0.14;
const px2 = (size - pw2) / 2;
ctx.beginPath();
ctx.roundRect(px2, py - ph2, pw2, ph2, 4);
ctx.fill();

ctx.beginPath();
ctx.roundRect(px2, py + ph, pw2, ph2, 4);
ctx.fill();

const out = path.join(__dirname, "../resources/icon.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync(out, buffer);
console.log(`Icon saved to ${out}`);
