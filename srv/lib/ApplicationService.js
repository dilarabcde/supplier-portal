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

    async rejectApplication(applicationId, reason, revisionFields = []) {
        const { SupplierApplications, ApplicationRevisionFields } =
            cds.entities('supplierportal');

        await UPDATE(SupplierApplications)
            .set({
                status: 'Rejected',
                rejectionReason: reason,
                reapplyAllowed: true
            })
            .where({ ID: applicationId });

        if (revisionFields.length > 0) {
            const entries = revisionFields.map(fieldName => ({
                application_ID: applicationId,
                fieldName: fieldName
            }));

            await INSERT.into(ApplicationRevisionFields).entries(entries);
        }
    }

    async reapplyApplication(applicationId, changes) {
        const { SupplierApplications, ApplicationRevisionFields } =
            cds.entities('supplierportal');

        const revisionFields = await SELECT
            .from(ApplicationRevisionFields)
            .where({ application_ID: applicationId });

        const allowedFields = revisionFields.map(item => item.fieldName);
        const requestedFields = Object.keys(changes);

        const invalidFields = requestedFields.filter(
            field => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
            throw new Error(
                `Fields not allowed for revision: ${invalidFields.join(', ')}`
            );
        }

        await UPDATE(SupplierApplications)
            .set({
                ...changes,
                status: 'Submitted',
                rejectionReason: null,
                reapplyAllowed: false
            })
            .where({ ID: applicationId });

        await DELETE
            .from(ApplicationRevisionFields)
            .where({ application_ID: applicationId });
    }
}

module.exports = ApplicationService;