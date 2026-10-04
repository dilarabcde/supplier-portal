const cds = require("@sap/cds");

async function migrate() {
    const sqlite = await cds.connect.to("sqlite", {
        credentials: {
            url: "db.sqlite"
        }
    });

    const hana = await cds.connect.to("db");

    const tables = [
        "supplierportal.SupplierUsers",
        "supplierportal.SupplierApplications",
        "supplierportal.ApplicationHistory",
        "supplierportal.ApplicationRevisionFields"
    ];

    for (const table of tables) {
        const rows = await sqlite.run(SELECT.from(table));

        console.log(`${table}: ${rows.length} kayıt bulundu`);

        for (const row of rows) {

            // SQLite BLOB -> HANA LargeBinary
            if (
                table === "supplierportal.SupplierApplications" &&
                row.certificate
            ) {
                row.certificate = Buffer.from(row.certificate);
            }

            // Daha önce taşınmış kayıt varsa tekrar INSERT etme
            const existing = await hana.run(
                SELECT.one.from(table).where({ ID: row.ID })
            );

            if (existing) {
                console.log(`- ${row.ID} zaten mevcut, atlandı`);
                continue;
            }

            await hana.run(
                INSERT.into(table).entries(row)
            );

            console.log(`✓ ${row.ID} aktarıldı`);
        }

        console.log(`✓ ${table} tamamlandı`);
    }

    console.log("\n✓ TÜM MIGRATION TAMAMLANDI");
}

migrate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Migration hatası:", error);
        process.exit(1);
    });