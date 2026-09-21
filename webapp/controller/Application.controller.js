sap.ui.define([
    "./BaseController",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/Button"
], function (BaseController, Dialog, VBox, Label, Text, Button) {
    "use strict";

    return BaseController.extend(
        "com.abics.supplierportal.controller.Application",
        {
            onFileTypeMismatch: function () {
                const oBundle = this.getView().getModel("i18n").getResourceBundle();
                sap.m.MessageToast.show(oBundle.getText("onlyPdfAllowed"));
            },

            onFileSizeExceed: async function () {
                const oBundle = await this.getView()
                    .getModel("i18n")
                    .getResourceBundle();

                sap.m.MessageToast.show(
                    oBundle.getText("fileSizeExceeded")
                );
            },
            onCertificateChange: function (oEvent) {
                const oFile = oEvent.getParameter("files")[0];
                this._oCertificateFile = oFile;

                if (oFile && oFile.size > 10 * 1024 * 1024) {
                    const oBundle = this.getView().getModel("i18n").getResourceBundle();

                    sap.m.MessageToast.show(
                        oBundle.getText("fileSizeExceeded")
                    );

                    this.byId("certificateUploader").clear();
                }
            },
            onSubmitApplication: async function () {
                const oBundle = await this.getView()
                    .getModel("i18n")
                    .getResourceBundle();

                const sCompanyName = this.byId("companyNameInput").getValue().trim();
                const sContactPerson = this.byId("contactPersonInput").getValue().trim();
                const oUploader = this.byId("certificateUploader");
                const sCertificate = oUploader.getValue();

                if (!sCompanyName || !sContactPerson || !sCertificate) {
                    sap.m.MessageToast.show(
                        oBundle.getText("requiredFieldsMissing")
                    );

                    return;
                }
                const oApplicationData = {
                    companyName: sCompanyName,
                    contactPerson: sContactPerson,
                    phoneCountryCode: this.byId("phoneCodeSelect").getSelectedKey(),
                    phoneNumber: this.byId("phoneInput").getValue().trim(),
                    country: this.byId("countrySelect").getSelectedKey(),
                    category: this.byId("categorySelect").getSelectedKey(),
                    taxNumber: this.byId("taxNumberInput").getValue().trim(),
                    website: this.byId("websiteInput").getValue().trim(),
                    address: this.byId("addressInput").getValue().trim(),
                    notes: this.byId("notesInput").getValue().trim(),
                    certificateName: this._oCertificateFile.name,
                    certificateType: this._oCertificateFile.type || "application/pdf"
                };
                const oDialog = new Dialog({
                    title: oBundle.getText("applicationPreview"),

                    content: new VBox({
                        
                        items: [
                            new Label({ text: oBundle.getText("companyName") }),
                            new Text({ text: oApplicationData.companyName }),

                            new Label({
                                text: oBundle.getText("contactPerson"),
                                
                            }),
                            new Text({ text: oApplicationData.contactPerson }),

                            new Label({
                                text: oBundle.getText("phone"),
                                
                            }),
                            new Text({
                                text: oApplicationData.phoneCountryCode + " " + oApplicationData.phoneNumber
                            }),

                            new Label({
                                text: oBundle.getText("country"),
                                
                            }),
                            new Text({ text: oApplicationData.country }),

                            new Label({
                                text: oBundle.getText("category"),
                                
                            }),
                            new Text({ text: oApplicationData.category }),

                            new Label({
                                text: oBundle.getText("taxNumber"),
                                
                            }),
                            new Text({ text: oApplicationData.taxNumber }),

                            new Label({
                                text: oBundle.getText("website"),
                                
                            }),
                            new Text({ text: oApplicationData.website }),

                            new Label({
                                text: oBundle.getText("address"),
                                
                            }),
                            new Text({ text: oApplicationData.address }),

                            new Label({
                                text: oBundle.getText("notes"),
                                
                            }),
                            new Text({ text: oApplicationData.notes }),

                            new Label({
                                text: oBundle.getText("certificate"),
                                
                            }),
                            new Text({ text: sCertificate })
                        ]
                    }),

                    beginButton: new Button({
                        text: oBundle.getText("confirmSubmit"),
                        type: "Emphasized",

                        press: async () => {
                            try {
                                const oResponse = await fetch(
                                    "http://localhost:4004/odata/v4/supplier-management/Applications",
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify(oApplicationData)
                                    }
                                );

                                if (!oResponse.ok) {
                                    throw new Error("Application could not be saved.");
                                }

                                const oCreatedApplication = await oResponse.json();

                                const oFile = this._oCertificateFile;

                                if (oFile) {
                                    const oUploadResponse = await fetch(
                                        `http://localhost:4004/odata/v4/supplier-management/Applications(${oCreatedApplication.ID})/certificate`,
                                        {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type": oFile.type || "application/pdf"
                                            },
                                            body: oFile
                                        }
                                    );

                                    if (!oUploadResponse.ok) {
                                        throw new Error("Certificate could not be uploaded.");
                                    }
                                }
                                console.log("Created application:", oCreatedApplication);

                                oDialog.close();
                            } catch (oError) {
                                console.error("Application save error:", oError);
                            }
                        }
                    }),

                    endButton: new Button({
                        text: oBundle.getText("cancel"),
                        press: function () {
                            oDialog.close();
                        }
                    }),

                    afterClose: function () {
                        oDialog.destroy();
                    }
                });

                oDialog.open();

                console.log("Application data:", oApplicationData);
            }
        }
    );
});
