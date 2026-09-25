sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
    "use strict";

    return BaseController.extend("com.abics.supplierportal.controller.Approver", {

        onInit: function () {
            this._selectedStatus = "";
            this._selectedCategory = "";
            this._searchQuery = "";

            this._loadApplications();
        },

        _loadApplications: async function () {
            try {
                const response = await fetch(
                    "http://localhost:4004/odata/v4/supplier-management/Applications"
                );

                if (!response.ok) {
                    throw new Error("Applications could not be loaded.");
                }

                const data = await response.json();

                const applications = data.value || [];

                const oModel = new JSONModel({
                    applications: applications,

                    counts: {
                        all: applications.length,

                        pending: applications.filter(
                            app => app.status === "Submitted" ||
                                app.status === "InReview"
                        ).length,

                        approved: applications.filter(
                            app => app.status === "Approved"
                        ).length,

                        rejected: applications.filter(
                            app => app.status === "Rejected"
                        ).length
                    }
                });

                this.getView().setModel(oModel, "approver");

                console.log("Applications:", data.value);

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
                            new Filter("status", FilterOperator.EQ, "Submitted"),
                            new Filter("status", FilterOperator.EQ, "InReview")
                        ],
                        and: false
                    })
                );
            } else if (this._selectedStatus) {
                aFilters.push(
                    new Filter("status", FilterOperator.EQ, this._selectedStatus)
                );
            }

            // KATEGORİ
            if (this._selectedCategory) {
                aFilters.push(
                    new Filter("category", FilterOperator.EQ, this._selectedCategory)
                );
            }

            // ARAMA
            if (this._searchQuery) {
                aFilters.push(
                    new Filter({
                        filters: [
                            new Filter("companyName", FilterOperator.Contains, this._searchQuery),
                            new Filter("contactPerson", FilterOperator.Contains, this._searchQuery),
                            new Filter("supplier/email", FilterOperator.Contains, this._searchQuery)
                        ],
                        and: false
                    })
                );
            }

            oBinding.filter(aFilters);
        },
        onFilterApplications: function (oEvent) {
            this._selectedStatus = oEvent.getSource().data("status") || "";
            this._applyFilters();
        },
        onSearchApplications: function (oEvent) {
            this._searchQuery = oEvent.getParameter("newValue").trim();
            this._applyFilters();
        },
        onCategoryFilter: function (oEvent) {
            this._selectedCategory = oEvent.getSource().getSelectedKey() || "";
            this._applyFilters();
        }

    });
});