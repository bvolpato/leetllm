import { writeFileSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' });

// Imagen 3 model name for Node.js depends on the specific API, let's try 'imagen-3.0-generate-002' or similar

const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`;

async function generateImage(prompt: string): Promise<Buffer> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            instances: [
                {
                    prompt: prompt,
                }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "1:1",
                outputOptions: {
                    mimeType: "image/png"
                }
            }
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    if (data.predictions && data.predictions.length > 0) {
        const base64Image = data.predictions[0].bytesBase64Encoded;
        return Buffer.from(base64Image, 'base64');
    } else {
        throw new Error("No image generated.");
    }
}

async function main() {
    const data = JSON.parse(readFileSync("tools/social_banner_prompts.json", "utf-8"))
    let success = 0;

    for (const item of data) {
        const imgPath = join(item.folder, "social_banner.png");
        const txtPath = join(item.folder, "social_banner.txt");

        if (existsSync(imgPath)) {
            console.log(`[SKIP] Image already exists for: ${item.title}`);
            continue;
        }

        console.log(`[START] Generating for: ${item.title}`);
        try {
            const buf = await generateImage(item.prompt);
            writeFileSync(imgPath, buf);
            writeFileSync(txtPath, item.prompt, 'utf-8');
            console.log(`[SUCCESS] Saved image and prompt to ${item.folder}`);
            success++;
            // Small delay to prevent rate limits
            await new Promise(r => setTimeout(r, 2000));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`[ERROR] Failed to generate for ${item.title}: ${msg}`);
        }
    }

    console.log(`\nFinished! Successfully generated ${success} images.`);
}

main().catch(console.error);
