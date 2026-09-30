namespace supplierportal;

using { cuid, managed } from '@sap/cds/common';

type ApplicationStatus : String enum {
    Submitted;
    InReview;
    Approved;
    Rejected;
}

entity SupplierUsers : cuid, managed {
    email             : String(255) not null;
    passwordHash      : String(255) not null;
    emailVerified     : Boolean default false;
    verificationToken : String(255);
}

entity SupplierApplications : cuid, managed {
    companyName : String(150) not null;
    contactPerson : String(150) not null;

    phoneCountryCode : String(10);
    phoneNumber : String(30);

    country : String(100);
    category : String(100);
    taxNumber : String(50);
    website : String(255);
    address : String(500);
    notes : String(1000);

    supplier : Association to one SupplierUsers;
    status : ApplicationStatus default 'Submitted';

    certificate : LargeBinary
        @Core.MediaType: certificateType
        @Core.ContentDisposition.Filename: certificateName;

    certificateName : String(255);

    certificateType : String(100)
        @Core.IsMediaType;

// red gerekçesi ve başvururnun düzeltilmesi için izin
    rejectionReason : String(1000);
    reapplyAllowed : Boolean default false;
}
// revizyon izni hangi başvuruya ait ve düzeltilmesi gereken alanlar
entity ApplicationRevisionFields : cuid {
    application : Association to one SupplierApplications not null;
    fieldName : String(100) not null;
}

entity ApplicationHistory : cuid, managed {
    application : Association to one SupplierApplications not null;
    status : ApplicationStatus not null;
    action : String(50) not null;
    reason : String(1000);
    performedBy : String(255);
    revisionFields : String(1000);
}