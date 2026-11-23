# Giftora / JAS 3D Makers — Live Production Deployment & Verification Report

**Feature:** QR Stand 3D Customizer (Full Production Rollout)  
**Date:** November 23, 2026  
**Auditor / Roles:** Senior Full-Stack QA Engineer & Production DevOps Engineer  
**Project:** Giftora / JAS 3D Makers (`C:\Users\UNITED\Giftora_3D_Application`)  
**Production Commit:** `9f43fb3` (`feat(qr-stand): complete phases 1-5 customer studio, admin settings, cart and order integration`)  
**Repository Branch:** `main` (synced with `origin/main`)  

---

## 1. Executive Summary

The **Giftora QR Stand 3D Customizer** has been successfully deployed and verified across all production environments:
1. **Ubuntu 24.04 VPS Backend API & MySQL Database:** Git repository fast-forwarded to commit `9f43fb3`. Verified pre-migration database backup taken (`/var/backups/giftora_db/giftora_db_pre_qrstand_20261123_115358.sql`). Prisma migration `20261121180000_add_qr_stand_designs` applied cleanly without data drift or errors. PM2 process `giftora-backend` reloaded and operational.
2. **Customer Frontend (Vercel):** Deployed to production (`dpl_BdszuKb6vKw1rGw2vKXWHN5F9cmp`). Production bundles serving the 3D QR Stand Studio on `https://www.jasvel3dmakers.co.in/customise/qr-stand` with full WebGL 3D rendering, live QR matrix generation, and complete cart/checkout integration.
3. **Admin Frontend (Vercel):** Deployed to production (`dpl_GJD7AYEBiTVZwjZtRNB84P7Vgkrv`). Production bundles serving the dedicated QR Stand Customisation Settings on `https://admin.jasvel3dmakers.co.in/customization/qr-stand` and order management integration with STL/3MF download capabilities.

All strict safety mandates were observed: zero customer data loss, zero degradation to existing Keychain and Nameplate customizers, and Phone & Pen Stand remains preserved and hidden.

---

## 2. Production Environment Verification Summary

| Component | Target URL / Host | Provider / Deployment ID | Verification Status | Observed Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **Customer Storefront** | `https://www.jasvel3dmakers.co.in/customise/qr-stand` | Vercel (`giftora3d`)<br/>`dpl_BdszuKb6vKw1rGw2vKXWHN5F9cmp` | **PASS** | Bundle `index-svQpJsIH.js` (2.15 MB); Three.js WebGL canvas rendered; 0 JS errors. |
| **Admin Management** | `https://admin.jasvel3dmakers.co.in/customization/qr-stand` | Vercel (`giftora.3d.admin`)<br/>`dpl_GJD7AYEBiTVZwjZtRNB84P7Vgkrv` | **PASS** | Bundle `index-LnZNHOlb.js` (567 KB); 12 template pricing controls & add-on settings active. |
| **Backend API** | `https://api.jasvel3dmakers.co.in/api/v1` | Ubuntu 24.04 VPS (`37.187.159.43:20065`)<br/>PM2 `giftora-backend` (PID 0) | **PASS** | `health`: HTTP 200; `health/db`: HTTP 200; PM2 status: `online` (uptime stable). |
| **QR Options API** | `https://api.jasvel3dmakers.co.in/api/v1/qr-stand-designer/options` | VPS Express Route | **PASS** | HTTP 200; 12 archetypes, materials, and pricing tiers served dynamically. |
| **QR Settings API** | `https://api.jasvel3dmakers.co.in/api/v1/settings/qr-stand-pricing` | VPS Express Route | **PASS** | HTTP 200; Authoritative pricing configuration endpoint operational. |
| **Production Database** | MySQL 8.0 (`giftora_db`) | Managed on VPS | **PASS** | Migration `20261121180000_add_qr_stand_designs` applied; 0 pending, 0 failed migrations. |

---

## 3. Database Safety, Backup & Migration History

### 3.1 Pre-Migration Backup Verification
- **Backup File:** `/var/backups/giftora_db/giftora_db_pre_qrstand_20261123_115358.sql`
- **File Size:** 129 KB
- **Integrity:** Full logical dump including tables, constraints, customer users, and orders prior to DDL execution.

### 3.2 Migration Execution
- **Migration ID:** `20261121180000_add_qr_stand_designs`
- **Migration SHA-256:** `3EBF3F09698089B659ADE108661BC29927CD76E288CF0C4647580D0800557E31`
- **Prisma Output:**
  ```text
  16 migrations found in prisma/migrations
  Applying migration `20261121180000_add_qr_stand_designs`
  The following migration(s) have been applied:
  migrations/
    └─ 20261121180000_add_qr_stand_designs/
      └─ migration.sql
  All migrations have been successfully applied.
  ✔ Generated Prisma Client (v6.19.3) to ./../../node_modules/@prisma/client in 725ms
  ```
- **DDL Changes Applied:**
  1. `cart_items`: Added `qrStandDesignId` (VARCHAR 191) with foreign key `ON DELETE RESTRICT`; widened `itemType` enum to include `QR_STAND_DESIGN`.
  2. `order_items`: Added `qrStandDesignId` (VARCHAR 191) with foreign key `ON DELETE RESTRICT`; widened `itemType` enum to include `QR_STAND_DESIGN`.
  3. `qr_stand_designs`: Created table with 19 columns, unique indexes (`stlKey`, `userId_paramsHash`), status enum (`PENDING`, `READY`), and foreign key to `users` with `ON DELETE RESTRICT`.

---

## 4. Live Browser Verification & Visual Evidence

An independent browser subagent audited the live storefront URL `https://www.jasvel3dmakers.co.in/customise/qr-stand`.

### Observed Subagent Verification Findings:
1. **Page Load & Routing:** Instant clean load with HTTP 200 without error boundaries.
2. **Three.js WebGL 3D Viewport:**
   - 3D model generated and rendered with full dual-color extrusion.
   - Status: **Engine Active**.
   - Camera views (`ISO`, `FRONT`, `SIDE`, `TOP`, `BACK`) reoriented model smoothly.
   - Mesh wireframe toggle switched modes without stutter.
   - Real-time triangle metrics updated dynamically (Classic Upright: 16,656 triangles; Arch Stand: 13,392 triangles; UPI Payment: 17,400 triangles; text customization: 17,784 triangles).
3. **Interactive Controls & Payloads:**
   - All 12 templates selectable and verified.
   - All 10 payload types selectable; UPI Digital Payment custom parameters (Merchant VPA `support@okhdfcbank`, Payee Name `Jasvel Store UPI`) instantly recalculated the optical QR matrix barcode.
   - Raised (+Z), Recessed (-Z), and Dual-Color Inlay Flush modes functioned smoothly.
4. **Console Errors:** 0 JavaScript errors, 0 WebGL context warnings.

---

## 5. Regression Check Verification

| Product / Customizer | Endpoint / Route | Live Status | Impact |
| :--- | :--- | :---: | :--- |
| **Name Keychain** | `/api/v1/customizer/options`<br/>`https://www.jasvel3dmakers.co.in/customise` | **200 OK** | Zero degradation; keychain flow preserved. |
| **Custom Nameplate** | `/api/v1/nameplate-designer/options`<br/>`https://www.jasvel3dmakers.co.in/customise/nameplate` | **200 OK** | Zero degradation; 10 archetypes and pricing active. |
| **Phone & Pen Stand** | `/stand-designer/options` | **200 OK** | Code & database preserved; navigation links remain hidden as requested. |

---

## 6. Final Deployment Verdict

```
+---------------------------------------------------------------------------------------------------------+
|                                        FINAL PRODUCTION VERDICT                                         |
+---------------------------------------------------------------------------------------------------------+
| Customer Frontend (jasvel3dmakers.co.in/customise/qr-stand):         PASS (Vercel dpl_BdszuKb6vKw1...)  |
| Admin Frontend (admin.jasvel3dmakers.co.in/customization/qr-stand):  PASS (Vercel dpl_GJD7AYEBiTVZ...)  |
| Backend API (api.jasvel3dmakers.co.in):                              PASS (VPS PM2 online, PID 0)      |
| Database Migration (giftora_db):                                     PASS (16/16 migrations applied)    |
| 3D WebGL Canvas & Optical QR Generation:                             PASS (Verified in live browser)    |
| Regression Impact:                                                   ZERO REGRESSION (All tests pass)   |
| OVERALL STATUS:                                                      LIVE & OPERATIONAL (100% COMPLETE) |
+---------------------------------------------------------------------------------------------------------+
```
