import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const svgBuffer = readFileSync(resolve('public/favicon.svg'));

await Promise.all([
  sharp(svgBuffer).resize(192, 192).png().toFile('public/icon-192.png'),
  sharp(svgBuffer).resize(512, 512).png().toFile('public/icon-512.png'),
  sharp(svgBuffer).resize(180, 180).png().toFile('public/apple-touch-icon.png'),
]);

console.log('Icons generated successfully.');
