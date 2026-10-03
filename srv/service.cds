using { supplierportal as db } from '../db/schema';
// Veritabanındaki entity'leri servis katmanında kullanabilmek için içe aktarır.

 type LoginResult {
    userId : UUID;
    email  : String;
}

service SupplierManagementService {
    entity Applications as projection on db.SupplierApplications;
    entity ApplicationHistory as projection on db.ApplicationHistory;
    entity ApplicationRevisionFields as projection on db.ApplicationRevisionFields;
//başvuruyu gönderilmiş duruma geçirmek için s.aktivasyonu
    action submitApplication(applicationId : UUID) returns String;
    @requires: 'Approver'
    action startReview(applicationId : UUID) returns String;
    @requires: 'Approver'
    action approveApplication(applicationId : UUID) returns String;

    action rejectApplication(
        applicationId : UUID,
        reason : String,
        revisionFields : array of String
    ) returns String;
    @requires: 'Approver'
    action reapplyApplication(
        applicationId : UUID,
        changes : LargeString
    ) returns String;

    action register(
        email : String,
        password : String
    ) returns String;

    action login(
        email    : String,
        password : String
    ) returns LoginResult;
    
    action verifyEmail(
        token : String
    ) returns String;

    action getSupplierEmail(
        supplierId : UUID
    ) returns String;
    
    action analyzeApplication(
        applicationId : UUID
    ) returns LargeString;
}