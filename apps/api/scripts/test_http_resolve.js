async function run() {
    const url = "http://localhost:4000/posts/1cf5a6e2-ee15-4d83-a752-4aeaaa603f32/resolve";
    console.log("Fetching", url);
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "x-user-id": "demo-israel-seeder",
                "Content-Type": "application/json"
            }
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch threw:", e);
    }
}

run();
