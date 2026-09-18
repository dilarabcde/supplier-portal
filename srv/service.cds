using { supplierportal as db } from '../db/schema';
// Veritabanındaki entity'leri servis katmanında kullanabilmek için içe aktarır.


service SupplierManagementService {
    entity Applications as projection on db.SupplierApplications;
    entity ApplicationHistory as projection on db.ApplicationHistory;
//başvuruyu gönderilmiş duruma geçirmek için s.aktivasyonu
    action submitApplication(applicationId : UUID) returns String;

    action startReview(applicationId : UUID) returns String;

    action approveApplication(applicationId : UUID) returns String;

    action rejectApplication(
        applicationId : UUID,
        reason : String,
        revisionFields : array of String
    ) returns String;

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
    ) returns String;
    
    action verifyEmail(
        token : String
    ) returns String;
}