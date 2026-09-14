const cds = require('@sap/cds');

class ApplicationService {

    async getApplicationById(applicationId) {
        const { SupplierApplications } = cds.entities('supplierportal');

        return SELECT.one
            .from(SupplierApplications)
            .where({ ID: applicationId });
    }

    async updateStatus(applicationId, newStatus) {
        const { SupplierApplications } = cds.entities('supplierportal');

        return UPDATE(SupplierApplications)
            .set({ status: newStatus })
            .where({ ID: applicationId });
    }

    async startReview(applicationId) {
        return this.updateStatus(applicationId, 'InReview');
    }

    async approveApplication(applicationId) {
        return this.updateStatus(applicationId, 'Approved');
    }

    async rejectApplication(applicationId, reason) {
    const { SupplierApplications } = cds.entities('supplierportal');

    return UPDATE(SupplierApplications)
        .set({
            status: 'Rejected',
            rejectionReason: reason,
            reapplyAllowed: true
        })
        .where({ ID: applicationId });
}
}

module.exports = ApplicationService;