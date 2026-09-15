using { supplierportal as db } from '../db/schema';
// Veritabanındaki entity'leri servis katmanında kullanabilmek için içe aktarır.


service SupplierManagementService {
    entity Applications as projection on db.SupplierApplications;
 
//başvuruyu gönderilmiş duruma geçirmek için s.aktivasyonu
    action submitApplication(applicationId : UUID) returns String;
 
    action getApplicationStatus(applicationId : UUID) returns db.ApplicationStatus;

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

}