sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (
    BaseController,
    JSONModel,
    Filter,
    FilterOperator,
    Fragment,
    MessageBox,
    MessageToast
) {
    "use strict";

    return BaseController.extend("com.abics.supplierapprovals.controller.Approver", {

onInit: function () {
    this._selectedStatus = "Pending";
    this._selectedCategory = "";
    this._searchQuery = "";

    this._loadApplications().then(() => {
        this._applyFilters();
    });
},

        _loadApplications: async function () {
            try {
                const response = await fetch(
                    "/odata/v4/supplier-management/Applications"
                );

                if (!response.ok) {
                    throw new Error("Applications could not be loaded.");
                }

                const data = await response.json();
                const applications = data.value || [];

                // Her başvurunun e-postasını supplier_ID üzerinden getir
                for (const app of applications) {
                    app.supplierEmail = "";

                    if (app.supplier_ID) {
                        try {
                            const emailResponse = await fetch(
                                "/odata/v4/supplier-management/getSupplierEmail",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        supplierId: app.supplier_ID
                                    })
                                }
                            );

                            if (emailResponse.ok) {
                                const emailData = await emailResponse.json();

                                app.supplierEmail =
                                    typeof emailData === "string"
                                        ? emailData
                                        : emailData.value || "";
                            } else {
                                console.error(
                                    "Supplier email request failed:",
                                    emailResponse.status
                                );
                            }

                        } catch (emailError) {
                            console.error(
                                "Supplier email could not be loaded:",
                                emailError
                            );
                        }
                    }
                }

            // Tablo sıra numarası ve durum metni
            const oResourceBundle = await this.getView()
                .getModel("i18n")
                .getResourceBundle();

            applications.forEach((app, index) => {
                app.rowNumber = index + 1;

                switch (app.status) {
                    case "Submitted":
                        app.statusText = oResourceBundle.getText("submitted");
                        break;

                    case "InReview":
                        app.statusText = oResourceBundle.getText("underReview");
                        break;

                    case "Approved":
                        app.statusText = oResourceBundle.getText("approved");
                        break;

                    case "Rejected":
                        app.statusText = oResourceBundle.getText("rejected");
                        break;

                    default:
                        app.statusText = app.status;
                }
            });
            const oModel = new JSONModel({
                applications: applications,

tableTitle: oResourceBundle.getText("applicationsTitle"),

                counts: {
                    all: applications.length,

                    pending: applications.filter(
                        app =>
                            app.status === "Submitted" ||
                            app.status === "InReview"
                    ).length,

                    approved: applications.filter(
                        app => app.status === "Approved"
                    ).length,

                    rejected: applications.filter(
                        app => app.status === "Rejected"
                    ).length,

                    suppliers: applications.filter(
                        app => app.status === "Approved"
                    ).length
                }
            });

            this.getView().setModel(oModel, "approver");
            
            this._selectedStatus = "";
            this._selectedCategory = "";
            this._searchQuery = "";
            this._isSupplierHistoryMode = false;

            setTimeout(() => {
                const oTable = this.byId("applicationsTable");
                const oBinding = oTable && oTable.getBinding("items");

                if (oBinding) {
                    oBinding.filter([]);
                }
            }, 0);

            console.log("Applications with emails:", applications);

            console.log("Applications with emails:", applications);

            } catch (error) {
                console.error("Error loading applications:", error);
            }
        },

        _applyFilters: function () {
            const aFilters = [];

            const oTable = this.byId("applicationsTable");
            const oBinding = oTable && oTable.getBinding("items");

            if (!oBinding) {
                console.error("applicationsTable items binding bulunamadı");
                return;
            }
            // DURUM
            if (this._selectedStatus === "Pending") {
                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "Submitted"
                            ),
                            new Filter(
                                "status",
                                FilterOperator.EQ,
                                "InReview"
                            )
                        ],
                        and: false
                    })
                );

            } else if (this._selectedStatus) {
                aFilters.push(
                    new Filter(
                        "status",
                        FilterOperator.EQ,
                        this._selectedStatus
                    )
                );
            }

            // KATEGORİ
            if (this._selectedCategory) {
                aFilters.push(
                    new Filter(
                        "category",
                        FilterOperator.EQ,
                        this._selectedCategory
                    )
                );
            }

            // ARAMA
            if (this._searchQuery) {
                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter(
                                "companyName",
                                FilterOperator.Contains,
                                this._searchQuery
                            ),
                            new Filter(
                                "contactPerson",
                                FilterOperator.Contains,
                                this._searchQuery
                            ),
                            new Filter(
                                "supplierEmail",
                                FilterOperator.Contains,
                                this._searchQuery
                            )
                        ],
                        and: false
                    })
                );
            }

            oBinding.filter(aFilters);
        },

onFilterApplications: function (oEvent) {
    this._selectedStatus =
        oEvent.getSource().data("status") || "";

    this._isSupplierHistoryMode = false;

    const oModel = this.getView().getModel("approver");

    if (oModel) {
        const oResourceBundle = this.getView()
            .getModel("i18n")
            .getResourceBundle();

        oModel.setProperty(
            "/tableTitle",
            oResourceBundle.getText("applicationsTitle")
        );
    }

    this._applyFilters();
},

onShowSuppliers: function () {
    this._selectedStatus = "Approved";
    this._selectedCategory = "";
    this._searchQuery = "";

    this._isSupplierHistoryMode = true;

    const oModel = this.getView().getModel("approver");

    if (oModel) {
        const oResourceBundle = this.getView()
            .getModel("i18n")
            .getResourceBundle();

        oModel.setProperty(
            "/tableTitle",
            oResourceBundle.getText("suppliersTitle")
        );
    }

    this._applyFilters();
},

        onSearchApplications: function (oEvent) {
            this._searchQuery =
                oEvent.getParameter("newValue").trim();

            this._applyFilters();
        },

        onCategoryFilter: function (oEvent) {
            this._selectedCategory =
                oEvent.getSource().getSelectedKey() || "";

            this._applyFilters();
        },

        onApplicationPress: async function (oEvent) {
            const oApplication = oEvent
                .getSource()
                .getBindingContext("approver")
                .getObject();

            if (this._isSupplierHistoryMode) {
                await this._openSupplierHistory(oApplication);
                return;
            }

            const sStatus = oApplication.status;

            const oDetailData = {
                ...oApplication,

                isSubmitted: sStatus === "Submitted",
                isInReview: sStatus === "InReview",
                isFinished: sStatus === "Approved" || sStatus === "Rejected",

                submittedState: "Success",

                    reviewState:
                        sStatus === "Submitted"
                            ? "None"
                            : sStatus === "InReview"
                                ? "Warning"
                                : "Success",

                    reviewText:
                        sStatus === "Submitted"
                        ? ""
                        : sStatus === "InReview"
                            ? "İnceleniyor"
                            : "İncelendi",

                    resultState:
                        sStatus === "Approved"
                            ? "Success"
                            : sStatus === "Rejected"
                                ? "Error"
                                : "None",

                    resultText:
                        sStatus === "Approved"
                            ? "Onaylandı"
                            : sStatus === "Rejected"
                                ? "Reddedildi"
                                : ""
                };
                console.log("DETAIL DEBUG:", sStatus, oDetailData.isInReview, oDetailData);
                
                const oDetailModel = new JSONModel(oDetailData);
                this.getView().setModel(oDetailModel, "selectedApplication");

                this.getView().setModel(
                    oDetailModel,
                    "selectedApplication"
                );

                if (!this._oApplicationDetailDialog) {
                    this._oApplicationDetailDialog =
                        await Fragment.load({
                            id: this.getView().getId(),
                            name: "com.abics.supplierapprovals.fragment.ApplicationDetailDialog",
                            controller: this
                        });

                    this.getView().addDependent(
                        this._oApplicationDetailDialog
                    );
                }

                this._oApplicationDetailDialog.open();
            },

_openSupplierHistory: async function (oApplication) {
    try {
        const sApplicationId = oApplication.ID;

        // Tedarikçinin güncel ve tam başvuru bilgilerini getir
        const oApplicationResponse = await fetch(
            `/odata/v4/supplier-management/Applications(${sApplicationId})`
        );

        if (!oApplicationResponse.ok) {
            throw new Error("Application details could not be loaded");
        }

        const oFullApplication = await oApplicationResponse.json();

        // Başvurunun tüm geçmişini getir
        const oHistoryResponse = await fetch(
            `/odata/v4/supplier-management/ApplicationHistory?$filter=application_ID eq ${sApplicationId}&$orderby=createdAt desc`
        );

        if (!oHistoryResponse.ok) {
            throw new Error("Application history could not be loaded");
        }

        const oHistoryResult = await oHistoryResponse.json();
        const oResourceBundle = await this.getView()
            .getModel("i18n")
            .getResourceBundle();

        const mStatusKeys = {
            Submitted: "historySubmitted",
            InReview: "historyInReview",
            Approved: "historyApproved",
            Rejected: "historyRejected"
        };

        const mActionKeys = {
            ApplicationSubmitted: "historyApplicationSubmitted",
            ReviewStarted: "historyReviewStarted",
            Approved: "historyApprovedAction",
            Rejected: "historyRejectedAction"
        };

        const mRevisionFieldKeys = {
            certificate: "revisionFieldCertificate",
            category: "revisionFieldCategory"
        };
        const aHistory = (oHistoryResult.value || []).map((oItem) => {

            // Ret sırasında kaydettiğimiz revisionFields JSON string olarak geliyor.
            let aRevisionFields = [];

            if (oItem.revisionFields) {
                try {
                    aRevisionFields = JSON.parse(oItem.revisionFields);
                } catch (error) {
                    console.error(
                        "Revision fields parse error:",
                        error
                    );
                }
            }
            return {
                ...oItem,

                // Ekranda gösterilecek çevrilmiş değerler
                statusText: mStatusKeys[oItem.status]
                    ? oResourceBundle.getText(mStatusKeys[oItem.status])
                    : oItem.status,

                actionText: mActionKeys[oItem.action]
                    ? oResourceBundle.getText(mActionKeys[oItem.action])
                    : oItem.action,

                revisionFieldsArray: aRevisionFields.map((sField) => ({
                    key: sField,
                    text: mRevisionFieldKeys[sField]
                        ? oResourceBundle.getText(mRevisionFieldKeys[sField])
                        : sField
                })),

                hasRevisionFields:
                    aRevisionFields.length > 0,

                isRejected:
                    oItem.status === "Rejected",

                isApproved:
                    oItem.status === "Approved",

                isReapplied:
                    oItem.action === "Reapplied",

                isReviewStarted:
                    oItem.action === "ReviewStarted",

                formattedDate: oItem.createdAt
                    ? new Date(oItem.createdAt).toLocaleString("tr-TR")
                    : ""
            };            
            
        });
        const oInitialSubmission = {
            status: "Submitted",
            action: "ApplicationSubmitted",

            statusText: oResourceBundle.getText("historySubmitted"),
            actionText: oResourceBundle.getText("historyApplicationSubmitted"),

            createdAt: oFullApplication.createdAt,

            formattedDate: oFullApplication.createdAt
                ? new Date(oFullApplication.createdAt).toLocaleString("tr-TR")
                : "",

            isSubmitted: true,
            isRejected: false,
            isApproved: false,
            isReapplied: false,
            isReviewStarted: false,

            revisionFieldsArray: [],
            hasRevisionFields: false
        };

        aHistory.push(oInitialSubmission);

        // En yeniden en eskiye sırala
        aHistory.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        const sLanguage = sap.ui.getCore()
            .getConfiguration()
            .getLanguage();

        const oRegionNames = new Intl.DisplayNames(
            [sLanguage],
            { type: "region" }
        );

        const sCountryText = oFullApplication.country
            ? oRegionNames.of(oFullApplication.country)
            : "";

        const oSupplierHistoryData = {
            ...oFullApplication,
            supplierEmail: oApplication.supplierEmail || oApplication.email || "",
            countryText: sCountryText,

            formattedCreatedAt: oFullApplication.createdAt
                ? new Date(oFullApplication.createdAt).toLocaleString("tr-TR")
                : "",

            formattedModifiedAt: oFullApplication.modifiedAt
                ? new Date(oFullApplication.modifiedAt).toLocaleString("tr-TR")
                : "",

            hasCertificate: !!oFullApplication.certificateName,

            history: aHistory,

            hasHistory:
                aHistory.length > 0,

            hasRejection:
                aHistory.some(
                    (oItem) => oItem.status === "Rejected"
                )
        };


        console.log(
            "SUPPLIER HISTORY:",
            oSupplierHistoryData
        );

        const oSupplierHistoryModel =
            new JSONModel(oSupplierHistoryData);

        this.getView().setModel(
            oSupplierHistoryModel,
            "supplierHistory"
        );

        if (!this._oSupplierHistoryDialog) {
            this._oSupplierHistoryDialog =
                await Fragment.load({
                    id: this.getView().getId(),
                    name: "com.abics.supplierapprovals.fragment.SupplierHistoryDialog",
                    controller: this
                });

            this.getView().addDependent(
                this._oSupplierHistoryDialog
            );
        }

        this._oSupplierHistoryDialog.open();

    } catch (error) {

        console.error(
            "Supplier history error:",
            error
        );

        MessageBox.error(
            "Tedarikçi geçmişi açılamadı."
        );
    }
},
onOpenSupplierCertificate: function () {
    const oModel = this.getView().getModel("supplierHistory");
    const oApplication = oModel?.getData();

    if (!oApplication?.ID) {
        return;
    }

    window.open(
        `/odata/v4/supplier-management/Applications(${oApplication.ID})/certificate`,
        "_blank"
    );
},

onCloseSupplierHistory: function () {
    this._oSupplierHistoryDialog.close();
},

            onRefresh: function () {
                this._loadApplications();
            },
onStartReview: async function () {
    try {
        const oModel = this.getView().getModel("selectedApplication");
        const oApplication = oModel.getData();

        const response = await fetch(
            "/odata/v4/supplier-management/startReview",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    applicationId: oApplication.ID
                })
            }
        );

        if (!response.ok) {
            throw new Error("Application review could not be started.");
        }

        // Dialog KAPANMIYOR.
        // İncelemeye Al butonunu kaldır.
        oModel.setProperty("/status", "InReview");
        oModel.setProperty("/isSubmitted", false);

        // AI ile Analiz Et / Onayla / Reddet butonlarını göster.
        oModel.setProperty("/isInReview", true);
        oModel.setProperty("/isApproved", false);
        oModel.setProperty("/isRejected", false);

        // Arka plandaki listeyi güncelle.
        await this._loadApplications();

    } catch (error) {
        console.error("Error starting review:", error);
    }
},
        onOpenCertificate: async function () {
            try {
                const oApplication = this.getView()
                    .getModel("selectedApplication")
                    .getData();

                if (!oApplication || !oApplication.ID) {
                    MessageBox.error("Sertifika bulunamadı.");
                    return;
                }

                const sUrl =
                    "/odata/v4/supplier-management/Applications(" +
                    oApplication.ID +
                    ")/certificate/$value";

                const response = await fetch(sUrl);

                if (!response.ok) {
                    throw new Error("PDF could not be loaded.");
                }

                const blob = await response.blob();

                const pdfBlob = new Blob(
                    [blob],
                    { type: "application/pdf" }
                );

                const sPdfUrl = URL.createObjectURL(pdfBlob);

                window.open(sPdfUrl, "_blank");

                setTimeout(function () {
                    URL.revokeObjectURL(sPdfUrl);
                }, 60000);

            } catch (error) {
                console.error("Error opening certificate:", error);
                MessageBox.error("Sertifika açılamadı.");
            }
        },
        onApproveApplication: async function () {
            try {
                const oApplication = this.getView()
                    .getModel("selectedApplication")
                    .getData();

                const response = await fetch(
                    "/odata/v4/supplier-management/approveApplication",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            applicationId: oApplication.ID
                        })
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
                this._oApplicationDetailDialog.close();

                // Onaydan sonra ana listeye geri dön
                this._selectedStatus = "Pending";

                // Backend'den güncel verileri getir
                await this._loadApplications();

                // Submitted + InReview filtresini tekrar uygula
                this._applyFilters();

                MessageToast.show("Başvuru onaylandı.");

            } catch (error) {
                console.error("Error approving application:", error);
                MessageBox.error("Başvuru onaylanamadı.");
            }
        },

        onRejectApplication: async function () {
            try {
                const oApplication = this.getView()
                    .getModel("selectedApplication")
                    .getData();

                const sReason = this.byId("decisionNote")
                    .getValue()
                    .trim();

                const aRevisionFields = this.byId("revisionFields")
                    .getSelectedKeys();

                if (!sReason) {
                    MessageBox.warning("Başvuruyu reddetmek için karar notu zorunludur.");
                    return;
                }

                const response = await fetch(
                    "/odata/v4/supplier-management/rejectApplication",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            applicationId: oApplication.ID,
                            reason: sReason,
                            revisionFields: aRevisionFields
                        })
                    }
                );

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }

                this._oApplicationDetailDialog.close();

                this._selectedStatus = "Pending";

                await this._loadApplications();

                this._applyFilters();

                MessageToast.show("Başvuru reddedildi.");

            } catch (error) {
                console.error("Error rejecting application:", error);
                MessageBox.error("Başvuru reddedilemedi.");
            }
        },
        onCloseApplicationDialog: function () {
            this._oApplicationDetailDialog.close();
        }

    });
    
});