import fs from "node:fs";
import path from "node:path";

const PAGES_DIR = path.join(process.cwd(), "src", "pages");

function processAstroFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  
  // Find if there are local project images in the file
  // Matches things like src="/progetti/..."
  const imageRegex = /src="(\/progetti\/[^"]+)"/g;
  
  if (!imageRegex.test(content)) {
    return; // No local project images to optimize in this file
  }
  
  console.log(`Processing file: ${filePath}`);
  
  // Reset regex index
  imageRegex.lastIndex = 0;
  
  // Replace src="path" with src={getProxyUrl("path")} data-src="path"
  let updatedContent = content.replace(imageRegex, (match, imgPath) => {
    // If it's a video, skip
    if (imgPath.endsWith(".mp4")) {
      return match;
    }
    return `src={getProxyUrl("${imgPath}")} data-src="${imgPath}"`;
  });
  
  // Now ensure we import getProxyUrl in the frontmatter
  const frontmatterRegex = /^---([\s\S]*?)---/;
  const match = updatedContent.match(frontmatterRegex);
  
  if (match) {
    let frontmatter = match[1];
    
    // Check if getProxyUrl is already imported
    if (!frontmatter.includes("getProxyUrl")) {
      // Find the last import or just prepend it to the frontmatter
      frontmatter = `\nimport { getProxyUrl } from "../utils/image";` + frontmatter;
      updatedContent = updatedContent.replace(frontmatterRegex, `---${frontmatter}---`);
      console.log(`✓ Added getProxyUrl import to: ${path.basename(filePath)}`);
    }
  } else {
    // If no frontmatter exists, create one
    updatedContent = `---
import { getProxyUrl } from "../utils/image";
---

` + updatedContent;
    console.log(`✓ Created frontmatter and added import to: ${path.basename(filePath)}`);
  }
  
  fs.writeFileSync(filePath, updatedContent, "utf8");
  console.log(`✓ Successfully updated: ${path.basename(filePath)}\n`);
}

function main() {
  console.log("Starting proxy injector in:", PAGES_DIR);
  if (!fs.existsSync(PAGES_DIR)) {
    console.error("Directory src/pages not found!");
    process.exit(1);
  }
  
  const files = fs.readdirSync(PAGES_DIR);
  for (const file of files) {
    const fullPath = path.join(PAGES_DIR, file);
    if (fs.statSync(fullPath).isFile() && file.endsWith(".astro")) {
      processAstroFile(fullPath);
    }
  }
  console.log("Proxy injection complete!");
}

main();
