sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("com.abics.supplierportal.controller.ApplicationStatus", {

    onInit: function () {
        const sBannerUrl = sap.ui.require.toUrl(
            "com/abics/supplierportal/images/bremen-main.jpeg"
        );

        this.getView().setModel(
            new JSONModel({
                bannerUrl: sBannerUrl
            }),
            "assets"
        );

        this.getOwnerComponent()
            .getRouter()
            .getRoute("applicationStatus")
            .attachPatternMatched(this._onRouteMatched, this);
    },

        _onRouteMatched: async function () {
            const sApplicationId =
                sessionStorage.getItem("supplierApplicationId");

            console.log("Application Status ID:", sApplicationId);

            const oResponse = await fetch(
                `/odata/v4/supplier-management/Applications(${sApplicationId})`);

            const oApplication = await oResponse.json();
            oApplication.email = sessionStorage.getItem("supplierEmail") || "";
            
            console.log("API RESPONSE:", oApplication);
    
            const oBundle = await this.getOwnerComponent()
                .getModel("i18n")
                .getResourceBundle();

            const mStatusKeys = {
                Submitted: "submitted",
                InReview: "underReview",
                Approved: "approved",
                Rejected: "rejected"
            };

            const sStatus = oApplication.status;

            // Üstteki "Durum" alanı
            oApplication.statusText = mStatusKeys[sStatus]
                ? oBundle.getText(mStatusKeys[sStatus])
                : sStatus;

            oApplication.statusState =
                sStatus === "Submitted"
                    ? "Success"
                    : sStatus === "InReview"
                        ? "Warning"
                        : sStatus === "Approved"
                            ? "Success"
                            : sStatus === "Rejected"
                                ? "Error"
                                : "None";


            // 1 - Gönderildi
            oApplication.submittedState = "Success";


            // 2 - İnceleme
            oApplication.isUnderReview =
                sStatus === "InReview";

            oApplication.isReviewCompleted =
                sStatus === "Approved" ||
                sStatus === "Rejected";

            oApplication.reviewState =
                sStatus === "InReview"
                    ? "Warning"
                    : oApplication.isReviewCompleted
                        ? "Success"
                        : "None";


            // 3 - Sonuç
            oApplication.isApproved =
                sStatus === "Approved";

            oApplication.isRejected =
                sStatus === "Rejected";

            oApplication.isResult =
                oApplication.isApproved ||
                oApplication.isRejected;

            oApplication.resultState =
                oApplication.isApproved
                    ? "Success"
                    : oApplication.isRejected
                        ? "Error"
                        : "None";


            const oStatusModel = new JSONModel(oApplication);

            this.getView().setModel(oStatusModel, "application");

            console.log("Application Status Data:", oApplication);
        },
        onEditApplication: function () {
            const oApplication = this.getView()
                .getModel("application")
                .getData();

            // Düzenlenecek başvurunun ID'sini sakla
            sessionStorage.setItem(
                "editApplicationId",
                oApplication.ID
            );

            // Form sayfasına dön
            this.getOwnerComponent()
                .getRouter()
                .navTo("application");
        },       

    });
});