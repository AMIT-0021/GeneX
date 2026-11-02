import fs from 'fs';
import path from 'path';

const distPath = path.resolve(process.cwd(), 'dist', 'index.html');
if (fs.existsSync(distPath)) {
  let html = fs.readFileSync(distPath, 'utf8');
  // Replace type="module" with defer so it works synchronously on file:// and waits for DOMContentLoaded on web servers
  html = html.replace(/<script type="module" crossorigin>/g, '<script defer>');
  html = html.replace(/<script type="module">/g, '<script defer>');
  fs.writeFileSync(distPath, html);
  console.log('Successfully patched dist/index.html to use <script defer> for universal protocol & web support!');
}
