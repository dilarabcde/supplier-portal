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

                if (!sCompanyName || !sContactPerson || !sCertificate) {
                    sap.m.MessageToast.show(
                        oBundle.getText("requiredFieldsMissing")
                    );

                    return;
                }
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
                    certificateName: this._oCertificateFile.name,
                    certificateType: this._oCertificateFile.type || "application/pdf"
                };

                const sPdfUrl = this._oCertificateFile
                    ? URL.createObjectURL(this._oCertificateFile)
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

            content: [
                new ObjectStatus({
                    text: sCertificate,
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
        })
    ]
}).addStyleClass("sapUiResponsiveContentPadding"),
                    beginButton: new Button({
                        text: oBundle.getText("confirmSubmit"),
                        type: "Emphasized",

                        press: async () => {
                            try {
                                const oResponse = await fetch(
                                    "/odata/v4/supplier-management/Applications",
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
                                    sessionStorage.setItem(
                                        "supplierApplicationId",
                                        oCreatedApplication.ID
                                    );
                                const oFile = this._oCertificateFile;

                                if (oFile) {
                                    const oUploadResponse = await fetch(
                                        `/odata/v4/supplier-management/Applications(${oCreatedApplication.ID})/certificate`,
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
    src: sap.ui.require.toUrl("com/abics/supplierportal/images/tik.png"),
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
