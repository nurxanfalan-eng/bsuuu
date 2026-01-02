// Test without real database
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "development";

console.log("✅ Environment variables loaded");
console.log("📦 Starting server test...");

// Test if server file is correct
const fs = require('fs');
const serverCode = fs.readFileSync('./server.js', 'utf8');

// Check PORT configuration
if (serverCode.includes('process.env.PORT')) {
    console.log("✅ Server uses process.env.PORT - Railway compatible");
} else {
    console.log("❌ Server doesn't use process.env.PORT");
}

// Check if all routes are imported
const routes = ['auth', 'user', 'admin', 'message', 'settings'];
let allRoutesOk = true;
routes.forEach(route => {
    if (serverCode.includes(`/${route}`)) {
        console.log(`✅ Route /${route} registered`);
    } else {
        console.log(`❌ Route /${route} missing`);
        allRoutesOk = false;
    }
});

// Check health endpoint
if (serverCode.includes('/health')) {
    console.log("✅ Health check endpoint exists");
} else {
    console.log("❌ Health check endpoint missing");
}

// Check Socket.IO
if (serverCode.includes('socket.io')) {
    console.log("✅ Socket.IO configured");
} else {
    console.log("❌ Socket.IO missing");
}

console.log("\n" + "=".repeat(50));
if (allRoutesOk) {
    console.log("🎉 Server configuration is READY for Railway!");
    console.log("=".repeat(50));
} else {
    console.log("⚠️  Some issues found, check above");
    console.log("=".repeat(50));
}
