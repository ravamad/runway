const sharp = require("sharp");
const fs = require("fs-extra");
const path = require("path");

const inputImage = "../assets/img/logo-mobile.png"; // Replace with your base image
const outputDir = "favicons";
const configFile = "business-config.json";

// Default values in case the JSON file is missing or incomplete
const defaultConfig = {
    appName: "Default Business",
    shortName: "Business",
    themeColor: "#ffffff",
    backgroundColor: "#ffffff"
};

async function loadConfig() {
    if (fs.existsSync(configFile)) {
        try {
            const configData = fs.readJsonSync(configFile);
            if (Array.isArray(configData) && configData.length > 0) {
                const business = configData[0]; // Assuming first object is the main business
                return {
                    appName: business.business_name || defaultConfig.appName,
                    shortName: business.business_name?.split(" ")[0] || defaultConfig.shortName,
                    themeColor: business.themeColor || defaultConfig.themeColor,
                    backgroundColor: business.backgroundColor || defaultConfig.backgroundColor
                };
            }
        } catch (error) {
            console.error("Error reading business-config.json. Using defaults.", error);
        }
    } else {
        console.warn("business-config.json not found. Using default values.");
    }
    return defaultConfig;
}

async function generateFavicons() {
    const config = await loadConfig();
    await fs.ensureDir(outputDir);
    const htmlTags = [];

    const sizes = [16, 32, 48, 57, 60, 72, 76, 96, 120, 144, 152, 180, 192, 512];
    const appleSizes = [57, 60, 72, 76, 120, 144, 152, 180];

    for (const size of sizes) {
        const filename = `favicon-${size}x${size}.png`;
        await sharp(inputImage)
            .resize(size, size)
            .toFile(`${outputDir}/${filename}`);
        htmlTags.push(`<link rel="icon" type="image/png" sizes="${size}x${size}" href="/${outputDir}/${filename}">`);
    }

    // Apple Touch Icons
    for (const size of appleSizes) {
        const filename = `apple-touch-icon-${size}x${size}.png`;
        await sharp(inputImage)
            .resize(size, size)
            .toFile(`${outputDir}/${filename}`);
        htmlTags.push(`<link rel="apple-touch-icon" sizes="${size}x${size}" href="/${outputDir}/${filename}">`);
    }

    // Microsoft Tile
    const msTile = "mstile-150x150.png";
    await sharp(inputImage)
        .resize(150, 150)
        .toFile(`${outputDir}/${msTile}`);
    htmlTags.push(`<meta name="msapplication-TileImage" content="/${outputDir}/${msTile}">`);

    // Favicon.ico (Legacy support)
    await sharp(inputImage)
        .resize(48, 48)
        .toFile(`${outputDir}/favicon.ico`);
    htmlTags.push(`<link rel="shortcut icon" href="/${outputDir}/favicon.ico">`);

    // Web Manifest
    const manifest = {
        name: config.appName,
        short_name: config.shortName,
        icons: sizes.map(size => ({
            src: `/${outputDir}/favicon-${size}x${size}.png`,
            sizes: `${size}x${size}`,
            type: "image/png"
        })),
        theme_color: config.themeColor,
        background_color: config.backgroundColor,
        display: "standalone"
    };

    fs.writeFileSync(`${outputDir}/site.webmanifest`, JSON.stringify(manifest, null, 2));
    htmlTags.push(`<link rel="manifest" href="/${outputDir}/site.webmanifest">`);
    htmlTags.push(`<meta name="theme-color" content="${config.themeColor}">`);

    console.log("✅ Favicons generated successfully!");
    console.log("\n📌 Add this to your <head>:\n");
    console.log(htmlTags.join("\n"));
}

generateFavicons().catch(console.error);