import { writeFileSync, mkdirSync, existsSync } from "fs";

const DATASET_URL =
  "https://huggingface.co/datasets/Suchinthana/crime_dataset/resolve/main/data/train-00000-of-00001.parquet";
const OUTPUT_PATH = "data/crime_dataset.parquet";

async function main() {
  if (existsSync(OUTPUT_PATH)) {
    console.log(`File already exists at ${OUTPUT_PATH}. Skipping download.`);
    return;
  }

  mkdirSync("data", { recursive: true });
  console.log(`Downloading dataset from Hugging Face...`);

  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
