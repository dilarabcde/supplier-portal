const cds = require("@sap/cds");

cds.on("bootstrap", (app) => {
    app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", "http://localhost:8080");
    response.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    response.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );

    if (request.method === "OPTIONS") {
        return response.sendStatus(200);
    }

    next();
});

    app.get("/verify-email", async (request, response) => {
        const token = request.query.token;

        if (!token) {
            return response.status(400).send("Verification token is required");
        }

        try {
            const { SupplierUsers } = cds.entities("supplierportal");

            const user = await SELECT.one
                .from(SupplierUsers)
                .where({ verificationToken: token });

            if (!user) {
                return response
                    .status(400)
                    .send("Invalid or expired verification link");
            }

            await UPDATE(SupplierUsers)
                .set({
                    emailVerified: true,
                    verificationToken: null
                })
                .where({ ID: user.ID });

        return response.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>E-mail Verified</title>
            </head>
            <body>
                <main align="center">

                    <h1>E-mail verified successfully.</h1>

                    <p>You can now sign in.</p>
                </main>
            </body>
            </html>
        `);
        } catch (error) {
            console.error("E-mail verification error:", error);
            return response.status(500).send("E-mail verification failed");
        }
    });
});

module.exports = cds.server;