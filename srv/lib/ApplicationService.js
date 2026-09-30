const cds = require('@sap/cds');

class ApplicationService {

async addHistory(
    applicationId,
    status,
    action,
    reason = null,
    performedBy = null,
    revisionFields = null
) {
    const { ApplicationHistory } = cds.entities('supplierportal');

    return INSERT.into(ApplicationHistory).entries({
        application_ID: applicationId,
        status,
        action,
        reason,
        performedBy,
        revisionFields
    });
}

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
        await this.updateStatus(applicationId, 'InReview');

        await this.addHistory(
            applicationId,
            'InReview',
            'ReviewStarted'
        );
    }

    async approveApplication(applicationId) {
        await this.updateStatus(applicationId, 'Approved');

        await this.addHistory(
            applicationId,
            'Approved',
            'Approved'
        );
    }

    async rejectApplication(applicationId, reason, revisionFields = []) {
        const { SupplierApplications, ApplicationRevisionFields } =
            cds.entities('supplierportal');

        const allowedRevisionFields = [
            "companyName",
            "contactPerson",
            "phoneCountryCode",
            "phoneNumber",
            "country",
            "category",
            "taxNumber",
            "website",
            "address",
            "notes",
            "certificate"
        ];

        const invalidRevisionFields = revisionFields.filter(
            field => !allowedRevisionFields.includes(field)
        );

        if (invalidRevisionFields.length > 0) {
            throw new Error(
                `Invalid revision fields: ${invalidRevisionFields.join(", ")}`
            );
        }

        await UPDATE(SupplierApplications)
            .set({
                status: 'Rejected',
                rejectionReason: reason,
                reapplyAllowed: true
            })
            .where({ ID: applicationId });
            
            await this.addHistory(
                applicationId,
                'Rejected',
                'Rejected',
                reason,
                null,
                JSON.stringify(revisionFields)
            );
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
        await this.addHistory(
            applicationId,
            'Submitted',
            'Reapplied'
        );
        await DELETE
            .from(ApplicationRevisionFields)
            .where({ application_ID: applicationId });
    }
}

module.exports = ApplicationService;