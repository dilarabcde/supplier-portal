sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, Filter, FilterOperator, Fragment) {
    "use strict";

    return BaseController.extend("com.abics.supplierapprovals.controller.Approver", {

        onInit: function () {
            this._selectedStatus = "";
            this._selectedCategory = "";
            this._searchQuery = "";

            this._loadApplications();
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

                // Tablo sıra numarası
                applications.forEach((app, index) => {
                    app.rowNumber = index + 1;
                });

                const oModel = new JSONModel({
                    applications: applications,

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

                console.log("Applications with emails:", applications);

            } catch (error) {
                console.error("Error loading applications:", error);
            }
        },

        _applyFilters: function () {
            const aFilters = [];
            const oBinding = this.byId("applicationsTable").getBinding("items");

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

            const sStatus = oApplication.status;

            const oDetailData = {
                ...oApplication,

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

        onRefresh: function () {
            this._loadApplications();
        },
        onStartReview: async function () {
            try {
                const oApplication = this.getView()
                    .getModel("selectedApplication")
                    .getData();

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

                // Dialogu kapat
                this._oApplicationDetailDialog.close();

                // Başvuruları DB'den tekrar getir
                await this._loadApplications();

            } catch (error) {
                console.error("Error starting review:", error);
            }
        },
        onCloseApplicationDialog: function () {
            this._oApplicationDetailDialog.close();
        }

    });
});