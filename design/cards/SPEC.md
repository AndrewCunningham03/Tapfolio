# Tapfolio card artwork: supplier specification

Send this sheet with the files in `out/print/` and the proof `out/proof.png`.

## Files

| Side | Plastic (printed) | Metal (laser-engraved) |
|---|---|---|
| Front | `tapfolio-plastic-front.pdf` | `tapfolio-metal-front.pdf` |
| Back | `tapfolio-plastic-back.pdf` | `tapfolio-metal-back.pdf` |

PDFs are vector with all text converted to outlines. Matching SVGs are included for editing.

## Card

- Size: CR80 / ISO ID-1, **85.60 × 53.98 mm**, corner radius 3.18 mm
- Chip: **NXP NTAG213**
- Plastic: 0.76–0.84 mm PVC, matte finish both sides
- Metal: 0.8 mm stainless steel, matte black, with an anti-metal (ferrite) layer or chip window so NFC reads through the card

## Plastic card (printed)

- Artboard **91.60 × 59.98 mm** = trim size plus **3 mm bleed** on every side
- Safe area: all text and logos are at least 6 mm inside the trim
- Colours are CMYK:

| Colour | Use | C | M | Y | K |
|---|---|---|---|---|---|
| Dark green | Background | 80 | 30 | 65 | 80 |
| Pattern green | Front arcs | 80 | 25 | 65 | 60 |
| Yellow | Accent arc, "folio", icon | 0 | 20 | 95 | 0 |
| Off-white | Heading, www.tapfolio.co.uk | 3 | 0 | 3 | 0 |
| Green | "Tap" in the front logo | 80 | 0 | 80 | 10 |
| Platinum | Small text | 20 | 12 | 8 | 0 |
| White | QR panel | 0 | 0 | 0 | 0 |
| Black | QR code | 0 | 0 | 0 | 100 |

Please send a printed proof: the dark green must stay green, not print as black.

## Metal card (engraved)

- Artboard is the trim size, **85.60 × 53.98 mm** (no bleed)
- **Black in the files = laser-engrave.** Everything else stays black steel.
- Please send your template showing where the chip and antenna sit, so we can adjust the artwork if needed.

## Variable data: every card is different

We supply a CSV with one row per card:

```
card_id,url
7KQ2XMP,HTTPS://TAPFOLIO.CO.UK/C/7KQ2XMP
```

For **each row**, on the same physical card:

1. **NFC:** encode the `url` as an NDEF URI record, then **lock the chip (read-only)**.
2. **QR code** on the back:
   - Content: the same `url`, exactly as given (upper case keeps the code small)
   - Error correction: **M**
   - Size: **18 × 18 mm**, top-left corner at **x = 58.6 mm, y = 17.99 mm** from the top-left of the trimmed card. This places it centred in the 24 mm panel, leaving a 3 mm clear border.
   - Plastic: print black (K100) on the white panel.
   - Metal: the panel is engraved; **leave the QR modules unengraved** (reverse engraving) so the code reads dark-on-light.
3. **Check:** tap and scan every card, or a sample from each batch, and confirm the chip and QR open the same `url`. Send us the encoding report.

## Before production

- Digital proof of all four sides with a sample QR in place
- Physical samples: one plastic and one metal card, encoded with a test URL
- Confirm unit price at 100 / 250 / 500, lead time, and delivery to Northern Ireland
