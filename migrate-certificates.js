const cds = require("@sap/cds");
const { execFileSync } = require("child_process");

async function migrateCertificates() {
    const hana = await cds.connect.to("db");

    const output = execFileSync(
        "sqlite3",
        [
            "db.sqlite",
            "-separator",
            "|",
            `
            SELECT ID, companyName, certificateName, certificateType
            FROM supplierportal_SupplierApplications
            WHERE certificate IS NOT NULL;
            `
        ],
        { encoding: "utf8" }
    );

    const rows = output
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(line => {
            const [ID, companyName, certificateName, certificateType] =
                line.split("|");

            return {
                ID,
                companyName,
                certificateName,
                certificateType
            };
        });

    console.log(`${rows.length} sertifika bulundu.`);

    for (const row of rows) {

        // SQLite BLOB alanını HEX olarak güvenli biçimde al
        const hex = execFileSync(
            "sqlite3",
            [
                "db.sqlite",
                `
                SELECT hex(certificate)
                FROM supplierportal_SupplierApplications
                WHERE ID = '${row.ID}';
                `
            ],
            {
                encoding: "utf8",
                maxBuffer: 10 * 1024 * 1024
            }
        ).trim();

        // SQLite'taki BLOB -> içerdiği Base64 metni
        const storedValue = Buffer.from(hex, "hex");

        // Bizim eski SQLite kayıtlarında PDF Base64 olarak tutulmuş.
        // Base64 -> gerçek PDF binary
        const base64 = storedValue.toString("utf8").trim();
        const certificate = Buffer.from(base64, "base64");

        // Gerçek PDF olup olmadığını migration sırasında doğrula
        if (
            certificate.length < 5 ||
            certificate.subarray(0, 5).toString("ascii") !== "%PDF-"
        ) {
            throw new Error(
                `${row.companyName} için geçerli PDF elde edilemedi.`
            );
        }

        await hana.run(
            UPDATE("supplierportal.SupplierApplications")
                .set({
                    certificate,
                    certificateName: row.certificateName,
                    certificateType: row.certificateType
                })
                .where({ ID: row.ID })
        );

        console.log(
            `✓ ${row.companyName} - ${row.certificateName} (${certificate.length} gerçek PDF byte)`
        );
    }

    console.log("✓ TÜM SERTİFİKALAR GERÇEK PDF OLARAK HANA'YA AKTARILDI");
}

migrateCertificates()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Sertifika migration hatası:", err);
        process.exit(1);
    });