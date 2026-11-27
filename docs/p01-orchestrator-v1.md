# MR-S10 · AI Orchestrator V1.0 · Rintis P01

Rintis meneruskan checkpoint P01 Public/Member Map pada `eb302fa6dc8d5979c7f3cebe199c0df235c75c1e`. Kontrak AI Execution Mirror R1 menetapkan visi. Owner Command Center dan Owner Action Inbox menyediakan aliran laporan serta keputusan yang berasingan dan sudah wujud.

| Level | Model dalaman |
|---|---|
| 1 | Tugasan manual dengan bukti manual |
| 2 | Research, Verification dan Action tersedia secara berasingan |
| 3 | Satu aliran berskop dengan checkpoint Git dan keputusan QA |
| 4 | Aliran berjadual dengan keputusan Owner dan rekod pelaksanaan yang disahkan |
| 5 | Operasi merentas projek yang telah diuji, dengan pengasingan akses dan pemulihan |

Baseline ialah Level 2. Rintis menyasarkan Level 3 untuk satu kitaran P01 setempat. Integrasi langsung Owner Inbox dan operasi automatik merentas projek belum dinilai melalui rintis ini.

Jalankan daripada commit rintis dengan worktree bersih.

```sh
node scripts/p01-orchestrator.cjs
```

Research membaca checkpoint GIS dan kontrak CI pada SHA asas. Verification menyemak keturunan Git, skop perubahan dan kebersihan worktree. Action menjalankan empat fail ujian yang ditetapkan dalam kod. Output JSON memberikan SHA, hash bukti, hasil peringkat dan status HOLD. Status `TESTED` merujuk kepada larian setempat pada SHA tersebut. Untuk status hosted CI, padankan SHA dengan GitHub Actions secara berasingan.

Teks bukti kekal data. Perintah QA ditentukan dalam kod dan hanya berjalan selepas pengesahan skop. Tiada arahan bebas, sambungan akaun, ejen berasingan, penjadual baharu atau akses sistem Production. Sembilan calon dan 17 jurang kekal HOLD.

Pemulihan ialah beralih kembali ke branch atau commit asas. Tiada migrasi atau perubahan runtime diperlukan.

## Hosted receipt reconciliation · MATURE THE FOUNDATION

`reconcileHostedReceipt(checkpoint, run, jobs, recordedKeys)` is a pure P01 consumer. The caller must retrieve the run from the authenticated GitHub repository and the jobs endpoint for its exact run attempt; fixture or supplied JSON alone is not independent verification. It accepts only the existing pilot branch, push workflow, exact 40-character commit, completed successful source-contract job and five named successful steps. It returns a sanitized engineering receipt, never deployment or Owner approval. Deduplication key: `P01:<SHA>:hosted-ci`; pass keys already committed in the canonical tracker. A replay returns NO_DUPLICATE_WRITE. A failed run routes to RECOVER_QA; pending or inconsistent evidence never becomes VERIFIED. The consumer does not write the tracker itself, schedule work, or dispatch Codex/Work. Owner Inbox automation remains separate.
