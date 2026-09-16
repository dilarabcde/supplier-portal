sap.ui.define(function () {
	"use strict";

	return {
		name: "QUnit test suite for the UI5 Application: com.abics.supplierportal",
		defaults: {
			page: "ui5://test-resources/com/abics/supplierportal/Test.qunit.html?testsuite={suite}&test={name}",
			qunit: {
				version: 2
			},
			sinon: {
				version: 1
			},
			ui5: {
				language: "EN",
				theme: "sap_horizon"
			},
			coverage: {
				only: "com/abics/supplierportal/",
				never: "test-resources/com/abics/supplierportal/"
			},
			loader: {
				paths: {
					"com/abics/supplierportal": "../"
				}
			}
		},
		tests: {
			"unit/unitTests": {
				title: "Unit tests for com.abics.supplierportal"
			},
			"integration/opaTests": {
				title: "Integration tests for com.abics.supplierportal"
			}
		}
	};
});
