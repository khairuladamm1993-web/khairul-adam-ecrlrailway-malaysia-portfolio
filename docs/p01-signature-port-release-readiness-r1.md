# MR-S10 P01 · Signature Port Release Readiness R1

Tarikh 22 November 2026 · Skop branch calon P01 · Owner UAT = 0

## Sumber dan keputusan

- Branch `candidate/p01-signature-port-layer-r1-20261122`.
- SHA aplikasi yang diuji `52aa354b771dcd7afce28804438e8358180ec479`.
- Rujukan rollback perubahan R2 `4f8a5ea7518be931e27fd6c259a05c6ee3447043`. Ini ialah checkpoint source sebelum pembaikan. CI pada checkpoint itu gagal pada dua konfigurasi WebKit mudah alih.
- **GO untuk memohon kelulusan Protected Preview**. Kelulusan Principal Owner diperlukan sebelum deployment Protected Preview. Tiada deployment atau pergerakan alias dijalankan dalam workpack ini.

## Punca dan pembaikan

Pada [CI asal 45003332643](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/45003332643), Chromium lulus pada ketiga-tiga viewport dan WebKit lulus pada desktop sahaja. WebKit iPad dan iPhone membuka popup infrastruktur Northport sehingga ujian tamat masa menunggu popup pelabuhan. Tangkapan kegagalan menunjukkan marker ungu sudah dilukis. Kod sebelum pembaikan menggunakan pendengar klik MapLibre untuk pelabuhan dan pengendali sentuhan berasingan untuk ECRL. Kedua-dua rekod Northport berkongsi kedudukan pada ketepatan skrin. Westports mempunyai keadaan koordinat rujukan yang sama.

Klik dan sentuhan kini melalui pemilihan aset yang sama. Marker ungu mendapat keutamaan apabila jarak hampir sama dalam toleransi 1 piksel. Rekod perancangan ECRL di lokasi itu boleh dibuka melalui butang khusus dalam popup pelabuhan. Popup berkongsi pengurusan penutupan sedia ada. Legenda menamakan kedua-dua pelabuhan dan popup memaparkan sumber Port Klang Authority serta penjelasan bahawa marker ialah rujukan kawasan tanpa sambungan ECRL yang disahkan.

## Resit QA

[GitHub Actions 45004206552](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/45004206552) · [Artifak p01-signature-browser-qa](https://github.com/khairuladamm1993-web/khairul-adam-ecrlrailway-malaysia-portfolio/actions/runs/45004206552/artifacts/14746809656)

- Unit Regression 42/42 PASS, 0 FAIL. Build V8 mengeluarkan `V8_PUBLIC_ONLY_BUILD_READY`.
- Artifak mengandungi `report.json` dan tangkapan skrin legenda, Northport, Westports serta pemilihan ECRL berhampiran.
- Ujian pelayar menyemak MapLibre, WebGL, lapisan ECRL, marker halo dan pusat yang dirender, identiti popup, sumber, penjelasan, satu popup pada satu masa serta capaian rekod ECRL. Pada zoom 7, kedudukan sasaran Northport dan Jalan Kastam berbeza kira-kira 6.67 piksel. Kedua-duanya diuji dengan klik atau sentuhan pada posisi sebenar.

| Konfigurasi | Chromium | WebKit |
|---|---|---|
| Desktop 1180 × 820 | PASS | PASS |
| iPad 810 × 1080 | PASS | PASS |
| iPhone 390 × 844 | PASS | PASS |

## Baseline dan baki risiko

16 stesen berkod, PL01–PL07, dua depot, warna, koordinat rujukan dan lapisan GIS dikekalkan. Kesemua 17 segmen GIS ECRL kekal **UNVERIFIED**. Tiada spurline, turnout atau sambungan rel baharu ditambah. Bahan sumber pelabuhan kekal pada taraf rujukan kawasan. Audit bebas transkripsi koordinat dan hak penggunaan handbook masih belum selesai.

Safari fizikal, kawalan sentuhan dan rotasi pada peranti Owner serta sesi Member/Owner di hos belum diuji. Sebelum Protected Preview dibina mengikut kelulusan Owner, rekod projek, perlindungan akses, SHA sasaran dan deployment/alias terdahulu sebagai rujukan rollback. Selepas diluluskan, sahkan SHA hos dan uji pemilihan kedua-dua marker, butang rekod ECRL dan penutupan popup pada iPad dan iPhone Safari.
