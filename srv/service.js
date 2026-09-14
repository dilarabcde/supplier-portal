const cds = require("@sap/cds");
const ApplicationService = require("./lib/ApplicationService");

module.exports = cds.service.impl(function () {

    const applicationService = new ApplicationService();

    this.on("getApplicationStatus", async (request) => {
        const application = await applicationService.getApplicationById(
            request.data.applicationId
        );

        if (!application) {
            return request.reject(404, "Application not found");
        }

        return application.status;
    });

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

    await applicationService.rejectApplication(
        request.data.applicationId,
        request.data.reason
    );

    return "Application rejected successfully";
});

});