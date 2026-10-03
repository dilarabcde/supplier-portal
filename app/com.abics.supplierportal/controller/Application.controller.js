sap.ui.define([
    "./BaseController",
    "sap/m/Dialog",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/Button",
    "sap/m/Title",
    "sap/m/ObjectStatus",
    "sap/ui/core/HTML",
    "sap/ui/core/Icon",
    "sap/m/Image",
    "sap/m/Panel"
], function (
    BaseController,
    Dialog,
    VBox,
    HBox,
    Label,
    Text,
    Button,
    Title,
    ObjectStatus,
    HTML,
    Icon,
    Image,
    Panel
) {
    "use strict";

    return BaseController.extend("com.abics.supplierportal.controller.Application",
        {
            onInit: function () {
                const sEmail = sessionStorage.getItem("supplierEmail");
                const oEmailText = this.byId("loggedInUserEmail");

                if (oEmailText) {
                    oEmailText.setText(sEmail || "");
                }

                this._loadRejectedApplicationForEditing();
            },

            _loadRejectedApplicationForEditing: async function () {
                const sEditApplicationId =
                    sessionStorage.getItem("editApplicationId");

                if (!sEditApplicationId) {
                    return;
                }

                try {
                    const oResponse = await fetch(
                        `/odata/v4/supplier-management/Applications(${sEditApplicationId})`
                    );

                    if (!oResponse.ok) {
                        throw new Error("Application could not be loaded.");
                    }

                    const oApplication = await oResponse.json();
                    const oExistingCertificateBox = this.byId("existingCertificateBox");
                        const oExistingCertificateLink = this.byId("existingCertificateLink");

                        if (oApplication.certificateName) {
                            oExistingCertificateLink.setText(oApplication.certificateName);
                            oExistingCertificateBox.setVisible(true);
                        } else {
                            oExistingCertificateBox.setVisible(false);
                        }

                    const oRevisionResponse = await fetch(
                        `/odata/v4/supplier-management/ApplicationRevisionFields?$filter=application_ID eq ${sEditApplicationId}`
                    );

                    if (!oRevisionResponse.ok) {
                        throw new Error("Revision fields could not be loaded.");
                    }

                    const oRevisionData = await oRevisionResponse.json();

                    const aRevisionFields = (oRevisionData.value || []).map(
                        (oItem) => oItem.fieldName
                    );

                    console.log("Revision fields:", aRevisionFields);

                    const mFieldControls = {
                        companyName: "companyNameInput",
                        contactPerson: "contactPersonInput",
                        phoneNumber: "phoneInput",
                        country: "countrySelect",
                        category: "categorySelect",
                        taxNumber: "taxNumberInput",
                        website: "websiteInput",
                        address: "addressInput",
                        notes: "notesInput",
                        certificate: "certificateUploader"
                    };

                    Object.entries(mFieldControls).forEach(
                        ([sFieldName, sControlId]) => {
                            const oControl = this.byId(sControlId);

                            if (!oControl) {
                                return;
                            }

                            const bCanEdit =
                                aRevisionFields.includes(sFieldName);

                            if (typeof oControl.setEditable === "function") {
                                oControl.setEditable(bCanEdit);
                            } else if (
                                typeof oControl.setEnabled === "function"
                            ) {
                                oControl.setEnabled(bCanEdit);
                            }
                        }
                    );

                    const bPhoneEditable =
                        aRevisionFields.includes("phoneNumber");

                    this.byId("phoneInput").setEditable(bPhoneEditable);
                    this.byId("phoneCodeSelect").setEnabled(bPhoneEditable);

                    oApplication.revisionFieldsArray = aRevisionFields;

                    this.byId("companyNameInput").setValue(
                        oApplication.companyName || ""
                    );

                    this.byId("contactPersonInput").setValue(
                        oApplication.contactPerson || ""
                    );

                    this.byId("phoneInput").setValue(
                        oApplication.phoneNumber || ""
                    );

                    this.byId("countrySelect").setSelectedKey(
                        oApplication.country || ""
                    );

                    this.byId("categorySelect").setSelectedKey(
                        oApplication.category || ""
                    );

                    this.byId("taxNumberInput").setValue(
                        oApplication.taxNumber || ""
                    );

                    this.byId("websiteInput").setValue(
                        oApplication.website || ""
                    );

                    this.byId("addressInput").setValue(
                        oApplication.address || ""
                    );

                    this.byId("notesInput").setValue(
                        oApplication.notes || ""
                    );

                    if (oApplication.phoneCountryCode) {
                        const oPhoneCodeSelect =
                            this.byId("phoneCodeSelect");

                        const oMatchingItem = oPhoneCodeSelect
                            .getItems()
                            .find((oItem) =>
                                oItem
                                    .getText()
                                    .includes(oApplication.phoneCountryCode)
                            );

                        if (oMatchingItem) {
                            oPhoneCodeSelect.setSelectedKey(
                                oMatchingItem.getKey()
                            );
                        }
                    }
                    this._existingCertificateName =
                        oApplication.certificateName || "";

                    console.log(
                        "Rejected application loaded for editing:",
                        oApplication
                    );

                } catch (oError) {
                    console.error(
                        "Application could not be loaded:",
                        oError
                    );
                }
            },
            onOpenExistingCertificate: function () {
                const sEditApplicationId =
                    sessionStorage.getItem("editApplicationId");

                if (!sEditApplicationId) {
                    return;
                }

                window.open(
                    `/odata/v4/supplier-management/Applications(${sEditApplicationId})/certificate`,
                    "_blank"
                );
            },

        _onApplicationRouteMatched: async function () {
            const sEditApplicationId =
                sessionStorage.getItem("editApplicationId");

            // Normal başvuruysa eski veri yükleme
            if (!sEditApplicationId) {
                return;
            }

            try {
                const oResponse = await fetch(
                    `/odata/v4/supplier-management/Applications(${sEditApplicationId})`
                );

                if (!oResponse.ok) {
                    throw new Error("Application could not be loaded.");
                }

                const oApplication = await oResponse.json();

                this.byId("companyNameInput").setValue(
                    oApplication.companyName || ""
                );

                this.byId("contactPersonInput").setValue(
                    oApplication.contactPerson || ""
                );

                this.byId("phoneCodeSelect").setSelectedKey(
                    oApplication.phoneCountryCode || "TR"
                );

                this.byId("phoneInput").setValue(
                    oApplication.phoneNumber || ""
                );

                this.byId("countrySelect").setSelectedKey(
                    oApplication.country || ""
                );

                this.byId("categorySelect").setSelectedKey(
                    oApplication.category || ""
                );

                this.byId("taxNumberInput").setValue(
                    oApplication.taxNumber || ""
                );

                this.byId("websiteInput").setValue(
                    oApplication.website || ""
                );

                this.byId("addressInput").setValue(
                    oApplication.address || ""
                );

                this.byId("notesInput").setValue(
                    oApplication.notes || ""
                );

                console.log(
                    "Application loaded for editing:",
                    oApplication
                );

            } catch (error) {
                console.error(
                    "Application could not be loaded for editing:",
                    error
                );
            }
        },
        

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

                if (!sCompanyName || !sContactPerson) {
                    sap.m.MessageToast.show(
                        oBundle.getText("requiredFieldsMissing")
                    );
                    return;
                }
                const sEditApplicationId =
                    sessionStorage.getItem("editApplicationId");

                const bIsReapply = !!sEditApplicationId;

                const sExistingCertificateName =
                    this._existingCertificateName || "";

                    
                const oApplicationData = {
                    companyName: sCompanyName,
                    contactPerson: sContactPerson,
                    supplier_ID: sessionStorage.getItem("supplierUserId"),
                    phoneCountryCode: this.byId("phoneCodeSelect").getSelectedKey(),
                    phoneNumber: this.byId("phoneInput").getValue().trim(),
                    country: this.byId("countrySelect").getSelectedKey(),
                    category: this.byId("categorySelect").getSelectedKey(),
                    taxNumber: this.byId("taxNumberInput").getValue().trim(),
                    website: this.byId("websiteInput").getValue().trim(),
                    address: this.byId("addressInput").getValue().trim(),
                    notes: this.byId("notesInput").getValue().trim(),
                    certificateName: this._oCertificateFile
                        ? this._oCertificateFile.name
                        : (bIsReapply ? sExistingCertificateName : null)
                };

                const sPdfUrl = this._oCertificateFile
                    ? URL.createObjectURL(this._oCertificateFile)
                    : bIsReapply
                        ? `/odata/v4/supplier-management/Applications(${sEditApplicationId})/certificate`
                        : "";

                const oDialog = new Dialog({
                    title: oBundle.getText("applicationPreview"),

                    contentWidth: "52rem",
                    contentHeight: "38rem",
                    verticalScrolling: true,

content: new VBox({
    width: "100%",
    items: [

        new sap.m.MessageStrip({
            text: oBundle.getText("previewDescription"),
            type: "Information",
            showIcon: true,
            showCloseButton: false
        }).addStyleClass("sapUiSmallMarginBottom"),

        new Panel({
            headerText: oBundle.getText("companyInformation"),
            expandable: false,
            width: "100%",

            content: [
                new HBox({
                    width: "100%",
                    justifyContent: "SpaceBetween",
                    alignItems: "Start",

                    items: [

                        new VBox({
                            width: "47%",
                            items: [
                                new Label({
                                    text: oBundle.getText("companyName")
                                }),
                                new Text({
                                    text: oApplicationData.companyName || "-"
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("contactPerson")
                                }),
                                new Text({
                                    text: oApplicationData.contactPerson || "-"
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("phone")
                                }),
                                new Text({
                                    text:
                                        (
                                            oApplicationData.phoneCountryCode +
                                            " " +
                                            oApplicationData.phoneNumber
                                        ).trim() || "-"
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("country")
                                }),
                                new Text({
                                    text: oApplicationData.country || "-"
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("category")
                                }),
                                new Text({
                                    text: oApplicationData.category || "-"
                                })
                            ]
                        }),

                        new VBox({
                            width: "47%",
                            items: [
                                new Label({
                                    text: oBundle.getText("taxNumber")
                                }),
                                new Text({
                                    text: oApplicationData.taxNumber || "-"
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("website")
                                }),
                                new Text({
                                    text: oApplicationData.website || "-"
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("address")
                                }),
                                new Text({
                                    text: oApplicationData.address || "-",
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMarginBottom"),

                                new Label({
                                    text: oBundle.getText("notes")
                                }),
                                new Text({
                                    text: oApplicationData.notes || "-",
                                    wrapping: true
                                })
                            ]
                        })
                    ]
                }).addStyleClass("sapUiResponsiveContentPadding")
            ]
        }).addStyleClass("sapUiSmallMarginBottom"),

new Panel({
    headerText: oBundle.getText("certificateInformation"),
    expandable: false,
    width: "100%",

    content: this._oCertificateFile
        ? [
            // Yeni sertifika seçilmiş → mevcut preview sistemi
            new ObjectStatus({
                text: this._oCertificateFile.name,
                icon: "sap-icon://pdf-attachment",
                state: "Information"
            }).addStyleClass("sapUiSmallMarginBottom"),

            new HTML({
                content:
                    '<div style="width:100%; text-align:center; overflow:auto;">' +
                        '<canvas id="certificatePdfCanvas" ' +
                        'style="max-width:100%; height:auto;"></canvas>' +
                    '</div>'
            })
        ]
        : sEditApplicationId && this._existingCertificateName
            ? [
                // Reapply + yeni sertifika seçilmemiş → eski sertifika linki
                new sap.m.Link({
                    text: this._existingCertificateName,
                    icon: "sap-icon://pdf-attachment",
                    press: () => {
                        window.open(
                            `/odata/v4/supplier-management/Applications(${sEditApplicationId})/certificate`,
                            "_blank"
                        );
                    }
                })
            ]
            : [
                new Text({
                    text: "-"
                })
            ]
})
    ]
}).addStyleClass("sapUiResponsiveContentPadding"),
                    beginButton: new Button({
                        text: oBundle.getText("confirmSubmit"),
                        type: "Emphasized",

                        press: async () => {
                            try {

                                let oResponse;

                                if (sEditApplicationId) {
                                    // Reddedilmiş başvuruyu yeniden gönderiyoruz
                                    oApplicationData.status = "Submitted";

                                    oResponse = await fetch(
                                        `/odata/v4/supplier-management/Applications(${sEditApplicationId})`,
                                        {
                                            method: "PATCH",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify(oApplicationData)
                                        }
                                    );
                                } else {
                                    // İlk başvuru
                                    oResponse = await fetch(
                                        "/odata/v4/supplier-management/Applications",
                                        {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json"
                                            },
                                            body: JSON.stringify(oApplicationData)
                                        }
                                    );
                                }

                                if (!oResponse.ok) {
                                    throw new Error("Application could not be saved.");
                                }

                                const oSavedApplication = await oResponse.json();

                                const sApplicationId =
                                    sEditApplicationId || oSavedApplication.ID;

                                sessionStorage.setItem(
                                    "supplierApplicationId",
                                    sApplicationId
                                );

                                // Düzenleme işlemi tamamlandı
                                sessionStorage.removeItem("editApplicationId");

                                const oFile = this._oCertificateFile;

                                if (oFile) {
                                    const oUploadResponse = await fetch(
                                        `/odata/v4/supplier-management/Applications(${sApplicationId})/certificate`,
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
                                console.log("Saved application:", oSavedApplication);

                                oDialog.removeAllContent();
                                oDialog.setTitle(oBundle.getText("applicationSuccessTitle"));

                                oDialog.addContent(
                                    new VBox({
                                        width: "100%",
                                        height: "30rem",
                                        alignItems: "Center",
                                        justifyContent: "Center",
                                        items: [
                                new Image({
                                    src: "/com.abics.supplierportal/images/tik.png",
                                    width: "5rem",
                                    height: "5rem",
                                    decorative: false,
                                    alt: "Success"
                                }).addStyleClass("sapUiMediumMarginBottom"),

                                            new Title({
                                                text: oBundle.getText("applicationSuccessMessage"),
                                                level: "H3"
                                            }).addStyleClass("sapUiSmallMarginBottom"),

                                            new Text({
                                                text: oBundle.getText("applicationStatusInfo"),
                                                textAlign: "Center",
                                                width: "100%"
                                            })
                                        ]
                                    })
                                );

                                oDialog.setBeginButton(
                                    new Button({
                                        text: oBundle.getText("continue"),
                                        type: "Emphasized",
                                        icon: "sap-icon://navigation-right-arrow",
                                        iconFirst: false,

                                        press: () => {
                                            oDialog.close();
                                            this.getOwnerComponent().getRouter().navTo("applicationStatus");
                                        }
                                    })
                                );

                                oDialog.setEndButton(null);
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

                setTimeout(async () => {
                    const oFile = this._oCertificateFile;
                    const oCanvas = document.getElementById("certificatePdfCanvas");

                    if (!oFile || !oCanvas) {
                        return;
                    }

                    const sPdfJsUrl = sap.ui.require.toUrl(
                        "com/abics/supplierportal/lib/pdfjs/pdf.mjs"
                    );

                    const sPdfWorkerUrl = sap.ui.require.toUrl(
                        "com/abics/supplierportal/lib/pdfjs/pdf.worker.mjs"
                    );

                    const pdfjsLib = await import(sPdfJsUrl);

                    pdfjsLib.GlobalWorkerOptions.workerSrc = sPdfWorkerUrl;

                    const oArrayBuffer = await oFile.arrayBuffer();

                    const oPdf = await pdfjsLib.getDocument({
                        data: oArrayBuffer
                    }).promise;

                    const oPage = await oPdf.getPage(1);

                    const oViewport = oPage.getViewport({
                        scale: 1.2
                    });

                    const oContext = oCanvas.getContext("2d");

                    oCanvas.width = oViewport.width;
                    oCanvas.height = oViewport.height;

                    await oPage.render({
                        canvasContext: oContext,
                        viewport: oViewport
                    }).promise;

                }, 300);

                console.log("Application data:", oApplicationData);
            }
        }
    );
});
