sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("com.abics.supplierportal.controller.Main", {
		onInit: function () {
			const oImageModel = new JSONModel({
				bremen: sap.ui.require.toUrl("com/abics/supplierportal/images/bremen.jpg"),
				logo: sap.ui.require.toUrl("com/abics/supplierportal/images/logo.png")
			});

			this.getView().setModel(oImageModel, "images");

			const rememberedEmail = localStorage.getItem("rememberedEmail");

			if (rememberedEmail) {
				this.byId("loginEmail").setValue(rememberedEmail);
				this.byId("rememberMe").setSelected(true);
			}
		},

		onLoginPress: function () {

			this.byId("registerArea").setVisible(false);
			this.byId("loginArea").setVisible(true);

			this.byId("homeButtons").setVisible(false);

		},

		onCloseLoginPress: function () {
			this.byId("loginArea").setVisible(false);
			this.byId("homeButtons").setVisible(true);
		},

		onRegisterPress: function () {
			this.byId("loginArea").setVisible(false);
			this.byId("registerArea").setVisible(true);
			this.byId("homeButtons").setVisible(false);
		},
		onToggleRegisterPassword: function () {
			const input = this.byId("registerPassword");
			input.setType(input.getType() === "Password" ? "Text" : "Password");
		},

		onToggleRegisterPasswordConfirm: function () {
			const input = this.byId("registerPasswordConfirm");
			input.setType(input.getType() === "Password" ? "Text" : "Password");
		},
		onPasswordLiveChange: function (event) {
			const password = event.getParameter("value");
			this.byId("passwordRules").setVisible(password.length > 0);

			const rules = {
				ruleLength: password.length >= 8,
				ruleUppercase: /[A-Z]/.test(password),
				ruleLowercase: /[a-z]/.test(password),
				ruleNumber: /[0-9]/.test(password),
				ruleSpecial: /[^A-Za-z0-9]/.test(password)
			};

			Object.keys(rules).forEach(function (id) {
				const rule = this.byId(id);
				const isValid = rules[id];

				rule.setState(isValid ? "Success" : "Error");
				rule.setIcon(
					isValid
						? "sap-icon://accept"
						: "sap-icon://decline"
				);
			}.bind(this));
		},
		onConfirmPasswordLiveChange: function (event) {
			const confirmPassword = event.getParameter("value");
			const password = this.byId("registerPassword").getValue();
			const status = this.byId("passwordMatchStatus");

			if (confirmPassword.length === 0) {
				status.setVisible(false);
				return;
			}

			status.setVisible(true);

			if (password === confirmPassword) {
				status.setText("Passwords match");
				status.setState("Success");
				status.setIcon("sap-icon://accept");
			} else {
				status.setText("Passwords do not match");
				status.setState("Error");
				status.setIcon("sap-icon://decline");
			}
		},

		onRegisterSubmit: async function () {
			const emailInput = this.byId("registerEmail");
			const passwordInput = this.byId("registerPassword");
			const confirmPasswordInput = this.byId("registerPasswordConfirm");

			const email = emailInput.getValue().trim();
			const password = passwordInput.getValue();
			const confirmPassword = confirmPasswordInput.getValue();

			const emailValid =/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

			const passwordValid =
				password.length >= 8 &&
				/[A-Z]/.test(password) &&
				/[a-z]/.test(password) &&
				/[0-9]/.test(password) &&
				/[^A-Za-z0-9]/.test(password);

			const passwordsMatch =
				password === confirmPassword &&
				confirmPassword.length > 0;

			// E-Mail kontrolü
			emailInput.setValueState(
				emailValid ? "None" : "Error"
			);

			emailInput.setValueStateText(
				"Please enter a valid e-mail address."
			);

			// Password kontrolü
			passwordInput.setValueState(
				passwordValid ? "None" : "Error"
			);

			passwordInput.setValueStateText(
				"Please meet all password requirements."
			);

			// Confirm Password kontrolü
			confirmPasswordInput.setValueState(
				passwordsMatch ? "None" : "Error"
			);

			confirmPasswordInput.setValueStateText(
				"Passwords do not match."
			);

			// Her şey doğru değilse kayıt işlemine devam etme
			if (!emailValid || !passwordValid || !passwordsMatch) {
				return;
			}

			try {
				const response = await fetch(
					"/odata/v4/supplier-management/register",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify({
							email: email,
							password: password
						})
					}
				);

				const result = await response.json();

				if (!response.ok) {
					throw new Error(
						result.error?.message || "Registration failed."
					);
				}

				console.log("Registration successful:", result);
				this.byId("registerForm").setVisible(false);
				this.byId("registerSuccessArea").setVisible(true);

				} catch (error) {
					console.error("Registration error:", error);

					if (error.message === "E-mail is already registered") {
						emailInput.setValueState("Error");
						emailInput.setValueStateText(
							"Bu e-posta adresiyle daha önce kayıt oluşturulmuş."
						);
						emailInput.focus();
					}
				}
		},
		onGoToLogin: function () {
			this.byId("registerArea").setVisible(false);
			this.byId("loginArea").setVisible(true);

			this.byId("registerSuccessArea").setVisible(false);
			this.byId("registerForm").setVisible(true);

			this.byId("homeButtons").setVisible(false);
		},
		onToggleLoginPassword: function () {
			const passwordInput = this.byId("loginPassword");

			if (passwordInput.getType() === "Password") {
				passwordInput.setType("Text");
				passwordInput.setValueHelpIconSrc("sap-icon://hide");
			} else {
				passwordInput.setType("Password");
				passwordInput.setValueHelpIconSrc("sap-icon://show");
			}
		},
onLoginSubmit: async function () {

    const emailInput = this.byId("loginEmail");
    const passwordInput = this.byId("loginPassword");
    const loginError = this.byId("loginError");

    const email = emailInput.getValue().trim();
    const password = passwordInput.getValue();

    emailInput.setValueState("None");
    passwordInput.setValueState("None");
    loginError.setVisible(false);

    try {

const response = await fetch(
    "/odata/v4/supplier-management/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

if (!response.ok) {
    emailInput.setValueState("Error");
    passwordInput.setValueState("Error");
    loginError.setVisible(true);
    return;
}

const result = await response.json();

        sessionStorage.setItem("supplierUserId", result.userId);
        sessionStorage.setItem("supplierEmail", result.email);

		const applicationResponse = await fetch(
    `/odata/v4/supplier-management/Applications?$filter=supplier_ID eq ${result.userId}`
);

const applicationData = await applicationResponse.json();

const hasApplication =
    applicationResponse.ok &&
    applicationData.value &&
    applicationData.value.length > 0;

	if (hasApplication) {
    const currentApplication = applicationData.value[0];

    sessionStorage.setItem(
        "supplierApplicationId",
        currentApplication.ID
    );

    console.log(
        "LOGIN -> supplierApplicationId:",
        currentApplication.ID
    );
} else {
    sessionStorage.removeItem("supplierApplicationId");
}
        const rememberMe = this.byId("rememberMe").getSelected();

        if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }

		if (hasApplication) {
			this.getOwnerComponent()
				.getRouter()
				.navTo("applicationStatus");
		} else {
			this.getOwnerComponent()
				.getRouter()
				.navTo("application");
		}

    } catch (error) {

        console.error("Login request error:", error);

        emailInput.setValueState("Error");
        passwordInput.setValueState("Error");
        loginError.setVisible(true);
    }
},

		onCloseRegisterPress: function () {
			this.byId("registerArea").setVisible(false);
			this.byId("homeButtons").setVisible(true);
		}

			});
		});