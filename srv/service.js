const cds = require("@sap/cds");
const crypto = require("crypto");
const { Resend } = require("resend");
const ApplicationService = require("./lib/ApplicationService");

module.exports = cds.service.impl(function () {

    const applicationService = new ApplicationService();

    this.on("submitApplication", async (request) => {
    const application = await applicationService.getApplicationById(
        request.data.applicationId
    );

    if (!application) {
        return request.reject(404, "Application not found");
    }

    await applicationService.updateStatus(
        request.data.applicationId,
        "Submitted"
    );

    return "Application submitted successfully";
    });

    this.on("startReview", async (request) => {
    const application = await applicationService.getApplicationById(
        request.data.applicationId
    );

    if (!application) {
        return request.reject(404, "Application not found");
    }

    await applicationService.startReview(request.data.applicationId);

    return "Application review started";
});

this.on("approveApplication", async (request) => {
    const application = await applicationService.getApplicationById(
        request.data.applicationId
    );

    if (!application) {
        return request.reject(404, "Application not found");
    }

    await applicationService.approveApplication(request.data.applicationId);

    return "Application approved successfully";
});

this.on("rejectApplication", async (request) => {
    const application = await applicationService.getApplicationById(
        request.data.applicationId
    );

    if (!application) {
        return request.reject(404, "Application not found");
    }

    if (!request.data.reason || !request.data.reason.trim()) {
        return request.reject(400, "Rejection reason is required");
    }

    try {
        await applicationService.rejectApplication(
            request.data.applicationId,
            request.data.reason,
            request.data.revisionFields
        );
    } catch (error) {
        return request.reject(400, error.message);
    }

    return "Application rejected successfully";
});

this.on("reapplyApplication", async (request) => {
    const application = await applicationService.getApplicationById(
        request.data.applicationId
    );

    if (!application) {
        return request.reject(404, "Application not found");
    }

    if (application.status !== "Rejected" || !application.reapplyAllowed) {
        return request.reject(400, "Application is not eligible for reapplication");
    }

    let changes;

    try {
        changes = JSON.parse(request.data.changes);
    } catch {
        return request.reject(400, "Invalid changes data");
    }

    try {
        await applicationService.reapplyApplication(
            request.data.applicationId,
            changes
        );
    } catch (error) {
        return request.reject(400, error.message);
    }

    return "Application reapplied successfully";
});

this.on("register", async (request) => {
    const email = request.data.email?.trim().toLowerCase();
    const password = request.data.password;

    if (!email || !password) {
        return request.reject(400, "E-mail and password are required");
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValid) {
        return request.reject(400, "Invalid e-mail address");
    }

    const passwordValid =
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password);

    if (!passwordValid) {
        return request.reject(400, "Password does not meet the requirements");
    }

    const { SupplierUsers } = cds.entities("supplierportal");

    const existingUser = await SELECT.one
        .from(SupplierUsers)
        .where({ email });

    if (existingUser) {
        return request.reject(409, "E-mail is already registered");
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const derivedKey = await new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, key) => {
            if (error) {
                reject(error);
            } else {
                resolve(key);
            }
        });
    });

const passwordHash = `${salt}:${derivedKey.toString("hex")}`;

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await INSERT.into(SupplierUsers).entries({
        email,
        passwordHash,
        emailVerified: false,
        verificationToken
    });
    
    const resend = new Resend(process.env.RESEND_API_KEY);

    const verificationUrl =`http://localhost:4004/verify-email?token=${verificationToken}`;
    
    
    const { error } = await resend.emails.send({
        from: "Supplier Portal <onboarding@resend.dev>",
        to: email,
        subject: "Verify your Supplier Portal account",
        html: `
            <h2>Supplier Portal</h2>
            <p>Thank you for registering.</p>
            <p>Please verify your e-mail address by clicking the link below:</p>
            <a href="${verificationUrl}">Verify E-mail</a>
        `
    });

    if (error) {
        console.error("Verification e-mail error:", error);
        return request.reject(500, "Verification e-mail could not be sent");
    }

    return "Registration successful";
});
this.on("verifyEmail", async (request) => {
    const token = request.data.token;

    if (!token) {
        return request.reject(400, "Verification token is required");
    }

    const { SupplierUsers } = cds.entities("supplierportal");

    const user = await SELECT.one
        .from(SupplierUsers)
        .where({ verificationToken: token });

    if (!user) {
        return request.reject(400, "Invalid verification token");
    }

    await UPDATE(SupplierUsers)
        .set({
            emailVerified: true,
            verificationToken: null
        })
        .where({ ID: user.ID });

    return "E-mail verified successfully";
});
this.on("login", async (request) => {
    const email = request.data.email?.trim().toLowerCase();
    const password = request.data.password;

    if (!email || !password) {
        return request.reject(400, "E-mail and password are required");
    }

    const { SupplierUsers } = cds.entities("supplierportal");

    const user = await SELECT.one
        .from(SupplierUsers)
        .where({ email });

    if (!user) {
        return request.reject(401, "Invalid e-mail or password");
    }

    if (!user.emailVerified) {
        return request.reject(403, "Please verify your e-mail before logging in");
    }

    const [salt, storedHash] = user.passwordHash.split(":");

    const derivedKey = await new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, key) => {
            if (error) {
                reject(error);
            } else {
                resolve(key);
            }
        });
    });

    const storedHashBuffer = Buffer.from(storedHash, "hex");
    const derivedKeyBuffer = Buffer.from(derivedKey);

    const passwordMatches =
        storedHashBuffer.length === derivedKeyBuffer.length &&
        crypto.timingSafeEqual(storedHashBuffer, derivedKeyBuffer);

    if (!passwordMatches) {
        return request.reject(401, "Invalid e-mail or password");
    }

    return {
        userId: user.ID,
        email: user.email
    };
});
    this.on("getSupplierEmail", async (request) => {
        const supplierId = request.data.supplierId;

        if (!supplierId) {
            return request.reject(400, "Supplier ID is required");
        }

        const { SupplierUsers } = cds.entities("supplierportal");

        const user = await SELECT.one
            .from(SupplierUsers)
            .columns("email")
            .where({ ID: supplierId });

        if (!user) {
            return request.reject(404, "Supplier not found");
        }

        return user.email;
    });
});