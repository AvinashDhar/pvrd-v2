#!/usr/bin/env python3
"""Build 100 OM PVRD products from the 2025 catalogue.

Every rate, code and size below was read from Product Catalogue all 2025.pdf.
The script refuses a product if that rate is not on the stated page, and it
attaches the photograph that sits with that caption.
"""

from __future__ import annotations

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import fitz
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "local-assets" / "requirements" / "Product Catalogue all 2025.pdf"
OUT_JSON = ROOT / "local-assets" / "catalogues" / "data" / "products-100.json"
IMAGE_DIR = ROOT / "local-assets" / "catalogues" / "data" / "products-100" / "images"
MATCHES = ROOT / "local-assets" / "catalogues" / "data" / "marketing-matches.json"

INCH = '"'


def V(name, price, size=None, finish=None, unit=None, packing=None):
    return {
        "name": name,
        "price": price,
        "size": size,
        "finish": finish,
        "unit": unit,
        "packing": packing,
    }


def P(
    page,
    anchor,
    category,
    name,
    price,
    unit=None,
    sku=None,
    variants=None,
    attrs=None,
    note=None,
    image_anchor=None,
    catalogue_page=None,
):
    return {
        "page": page,
        "anchor": anchor,
        "imageAnchor": image_anchor or anchor,
        "category": category,
        "name": name,
        "sku": sku,
        "price": price,
        "unit": unit,
        "variants": variants or [],
        "attributes": attrs or {},
        "note": note or "",
        "cataloguePage": catalogue_page,
    }


def sizes(pairs, unit="Pcs", finish=None):
    return [V(size, price, size=size, finish=finish, unit=unit) for size, price in pairs]


def matrix(sizes_list, finishes, unit="Pcs"):
    variants = []
    for finish, prices in finishes:
        for size, price in zip(sizes_list, prices):
            variants.append(V(f"{size} {finish}", price, size=size, finish=finish, unit=unit))
    return variants


# Printed page index in the PDF (0-based). Rates copied from that page.
PRODUCTS = [
    # Curtain brackets, printed page 01
    P(3, "CB001", "curtain-brackets", "L Bracket", "36", "Pair", "CB001", catalogue_page="01",
      note="Photograph shows three pieces, red, black and dark burgundy, at one rate."),
    P(3, "CB002", "curtain-brackets", "L Patti Sofia Bracket", "110", "Pair", "CB002", catalogue_page="01",
      note="Photograph marks two finishes, A and B, at one rate."),
    P(3, "CB009", "curtain-brackets", "SS Cylindrical Bracket", "144", "Pair", "CB009", catalogue_page="01",
      attrs={"finish": "SS"},
      note="Stainless cylindrical bracket. The photograph marks finishes A, B and C at one rate."),
    P(3, "CB010", "curtain-brackets", "Minar Manjira", "110", "Pair", "CB010", catalogue_page="01",
      note="Photograph marks finishes A, B, C, F and G at one rate."),
    P(3, "CB011", "curtain-brackets", "ABS Umbrella", "110", "Pair", "CB011", catalogue_page="01",
      note="ABS umbrella bracket. Photograph marks finishes A, B and C at one rate."),
    P(3, "CB018", "curtain-brackets", "Hans Antiq", "260", "Pair", "CB018", catalogue_page="01",
      attrs={"finish": "Antique Brass"},
      note="Photograph marks an antique piece A and a gold piece B at one rate."),
    P(3, "CB019", "curtain-brackets", "2 Tyre", "310", "Pair", "CB019", catalogue_page="01"),
    P(3, "CB017", "curtain-brackets", "Bottle Copper", "170", "Pair", "CB017", catalogue_page="01",
      attrs={"finish": "Copper"}),
    # Aldrops, printed page 06. 14 mm rod, 2 mm plate, as printed.
    P(8, "11No.", "door-aldrop", "AL004 14mm x 2mm 11 No.", "170", "Pcs", "AL004",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"},
      note="Rod diameter 14 mm and plate 2 mm, as printed. Lengths are the printed inch sizes.",
      variants=[
          V('10" Light', "170", size='10"', finish="Light", unit="Pcs"),
          V('12" Light', "200", size='12"', finish="Light", unit="Pcs"),
          V('10" Heavy', "190", size='10"', finish="Heavy", unit="Pcs"),
          V('12" Heavy', "230", size='12"', finish="Heavy", unit="Pcs"),
      ]),
    P(8, "4 LINE", "door-aldrop", "AL004 14mm x 2mm 4 Line", "170", "Pcs", "AL004",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"},
      note="Same 14 mm x 2 mm section as AL004 11 No., with the 4-line body shown on this page.",
      variants=[
          V('10" Light', "170", size='10"', finish="Light", unit="Pcs"),
          V('12" Light', "200", size='12"', finish="Light", unit="Pcs"),
          V('10" Heavy', "190", size='10"', finish="Heavy", unit="Pcs"),
          V('12" Heavy', "230", size='12"', finish="Heavy", unit="Pcs"),
      ]),
    P(8, "D-Lehar", "door-aldrop", "AL005 14mm x 2mm D-Lehar", "170", "Pcs", "AL005",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"},
      variants=[
          V('10" Light', "170", size='10"', finish="Light", unit="Pcs"),
          V('12" Light', "200", size='12"', finish="Light", unit="Pcs"),
          V('10" Heavy', "190", size='10"', finish="Heavy", unit="Pcs"),
          V('12" Heavy', "230", size='12"', finish="Heavy", unit="Pcs"),
      ]),
    P(8, "Jazz", "door-aldrop", "AL006 14mm x 2mm Jazz", "190", "Pcs", "AL006",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"},
      variants=[
          V('10"', "190", size='10"', unit="Pcs"),
          V('12"', "230", size='12"', unit="Pcs"),
      ]),
    P(8, "Tikli", "door-aldrop", "AL009 14mm x 2mm Tikli", "210", "Pcs", "AL009",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"}),
    P(8, "2 LINE", "door-aldrop", "AL002 14mm x 2mm 2 Line", "170", "Pcs", "AL002",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"},
      note="Only the light grade is printed for this design.",
      variants=[
          V('10" Light', "170", size='10"', finish="Light", unit="Pcs"),
          V('12" Light', "200", size='12"', finish="Light", unit="Pcs"),
      ]),
    P(8, "Lazer Line Sada", "door-aldrop", "AL010 14mm x 2mm Lazer Line Sada", "210", "Pcs", "AL010",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"}),
    P(8, "Lazer Bubble Sada", "door-aldrop", "AL011 14mm x 2mm Lazer Bubble Sada", "210", "Pcs", "AL011",
      catalogue_page="06",
      attrs={"rodDiameter": "14", "plateThickness": "2", "rodLength": "10", "size": '10"', "finish": "SS"}),
    # Door kits, printed page 12. The kit photograph includes the aldrop, pulls, tower bolt, latch and stopper.
    P(14, "LS-9 New", "door-kits", "Door Kit LS-9 New", "610", "Pcs", "DK-LS9",
      catalogue_page="12",
      attrs={"size": '10"', "aldrop": "LS-9 New", "aldropRodLength": "10", "aldropRodDiameter": "14", "aldropPlateThickness": "2", "finish": "SS"},
      note="Printed size 10 inch x 14 mm x 2 mm. The photograph shows the aldrop with pull handles, tower bolt, latch and door stopper. Separate sizes for those pieces are not printed."),
    P(14, "LS-2 Lehar", "door-kits", "Door Kit LS-2 Lehar", "610", "Pcs", "DK-LS2",
      catalogue_page="12",
      attrs={"size": '10"', "aldrop": "LS-2 Lehar", "aldropRodLength": "10", "aldropRodDiameter": "14", "aldropPlateThickness": "2", "finish": "SS"},
      note="Printed size 10 inch x 14 mm x 2 mm. The photograph shows the full kit."),
    P(14, "LS-6 Bubble", "door-kits", "Door Kit LS-6 Bubble", "610", "Pcs", "DK-LS6",
      catalogue_page="12",
      attrs={"size": '10"', "aldrop": "LS-6 Bubble", "aldropRodLength": "10", "aldropRodDiameter": "14", "aldropPlateThickness": "2", "finish": "SS"},
      note="Printed size 10 inch x 14 mm x 2 mm. The photograph shows the full kit."),
    P(14, "Kit T Antiq", "door-kits", "Door Kit T Antiq", "1150", "Pcs", "DK-T-ANTIQ",
      catalogue_page="12",
      attrs={"size": '10"', "aldrop": "T Antiq", "aldropRodLength": "10", "aldropRodDiameter": "16", "aldropPlateThickness": "3", "finish": "Antique Brass"},
      note="Printed size 10 inch x 16 mm x 3 mm, antique finish. The photograph shows the full kit."),
    P(14, "Butterfly Antiq", "door-kits", "Door Kit Butterfly Antiq", "1150", "Pcs", "DK-BUTTERFLY",
      catalogue_page="12",
      attrs={"size": '10"', "aldrop": "Butterfly Antiq", "aldropRodLength": "10", "aldropRodDiameter": "16", "aldropPlateThickness": "3", "finish": "Antique Brass"},
      note="Printed size 10 inch x 16 mm x 3 mm, antique finish. The photograph shows the full kit."),
    P(14, "Lehar Antiq", "door-kits", "Door Kit Lehar Antiq", "1150", "Pcs", "DK-LEHAR-ANTIQ",
      catalogue_page="12",
      attrs={"size": '10"', "aldrop": "Lehar Antiq", "aldropRodLength": "10", "aldropRodDiameter": "16", "aldropPlateThickness": "3", "finish": "Antique Brass"},
      note="Printed size 10 inch x 16 mm x 3 mm, antique finish. The photograph shows the full kit."),
    # Door handles, printed page 13
    P(15, "DH001", "door-handles", "SS D-Handle", "30", "Pcs", "DH001",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 19 mm x 2 mm', "plateLength": "6", "plateWidth": "19", "plateThickness": "2"},
      note="Plate printed as 6 inch x 19 mm x 2 mm.",
      variants=[
          V("DH001 (M)", "30", size='6" x 19 mm x 2 mm', finish="SS", unit="Pcs"),
          V("DH001 (H)", "32", size='6" x 19 mm x 2 mm', finish="SS", unit="Pcs"),
      ]),
    P(15, "DH002 (M)", "door-handles", "SS HOX-Handle", "30", "Pcs", "DH002",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 19 mm x 2 mm', "plateLength": "6", "plateWidth": "19", "plateThickness": "2"},
      variants=[
          V("DH002 (M)", "30", size='6" x 19 mm x 2 mm', finish="SS", unit="Pcs"),
          V("DH002 (H)", "32", size='6" x 19 mm x 2 mm', finish="SS", unit="Pcs"),
      ]),
    P(15, "DH002 S/P", "door-handles", "SS New C-Handle S/P", "40", "Pcs", "DH002 S/P",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 19 mm x 3 mm', "plateLength": "6", "plateWidth": "19", "plateThickness": "3"},
      note="Printed S/P. Plate 6 inch x 19 mm x 3 mm."),
    P(15, "SS Lehar Handle", "door-handles", "SS Lehar Handle", "32", "Pcs", None,
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6"'},
      variants=[
          V("19 mm x 2 mm", "32", size="19 mm x 2 mm", finish="SS", unit="Pcs"),
          V("22 mm x 3 mm S.P", "56", size="22 mm x 3 mm", finish="SS", unit="Pcs"),
      ]),
    P(15, "DH003", "door-handles", "SS HOX-Handle 6 inch", "40", "Pcs", "DH003",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 22 mm x 2.5 mm', "plateLength": "6", "plateWidth": "22", "plateThickness": "2.5"},
      note="Plate printed as 6 inch x 22 mm x 2.5 mm."),
    P(15, "DH004 D", "door-handles", "SS D-Handle S/P", "56", "Pcs", "DH004 D",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 22 mm x 3 mm', "plateLength": "6", "plateWidth": "22", "plateThickness": "3"}),
    P(15, "DH008", "door-handles", "SS Super D-Handle S/P", "84", "Pcs", "DH008",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 19 mm (8G)'},
      note="Printed as 6 inch x 19 mm, 8 gauge. Thickness in millimetres is not printed."),
    P(15, "Lazer 01 Handle", "door-handles", "SS Lazer 01 Handle", "50", "Pcs", "01",
      catalogue_page="13",
      attrs={"finish": "SS", "size": '6" x 21 mm x 2 mm', "plateLength": "6", "plateWidth": "21", "plateThickness": "2"},
      note='The catalogue prints the section as 6 inch x 21mx2mm. Product code on the page is 01.'),
    # Door fittings, printed page 17
    P(19, "Door Magnet M-5", "door-fittings", "Door Magnet M-5", "70", "Pcs", "DF001", catalogue_page="17"),
    P(19, "Door Magnet M-7", "door-fittings", "Door Magnet M-7", "76", "Pcs", "DF002", catalogue_page="17"),
    P(19, "Door Magnet S.D.", "door-fittings", "Door Magnet S.D.", "100", "Pcs", "DF003", catalogue_page="17"),
    P(19, "Door Closer", "door-fittings", "Door Closer", "1400", "Pcs", "DF035", catalogue_page="17"),
    P(19, "DF005", "door-fittings", "Door Stopper Single Pipe", "50", "Pcs", "DF005", catalogue_page="17"),
    P(19, "DF008", "door-fittings", "Door Stopper Double Square", "120", "Pcs", "DF008", catalogue_page="17",
      note='The catalogue spells this label "Doubble Square".'),
    P(19, "Interlock 10T PC", "door-interlocks", "Interlock 10T PC", "510", "Pcs", "DF013", catalogue_page="17",
      note="Supplied with keys, as photographed. No warranty period is printed."),
    P(19, "DF014 Interlock", "door-interlocks", "DF014 Interlock", "930", "Pcs", "DF014", catalogue_page="17",
      note="Supplied with keys, as photographed. No warranty period is printed.",
      variants=[
          V("3 Turn", "930", finish="3 Turn", unit="Pcs"),
          V("6 Turn", "1080", finish="6 Turn", unit="Pcs"),
      ]),
    # Hinges, printed page 21
    P(23, "MS ISI Butt Hinges", "door-hinges", "MS ISI Butt Hinges", "12", "Pcs", None,
      catalogue_page="21",
      attrs={"length": "3", "thickness": "16"},
      variants=sizes([('3" x 16(G)', "12"), ('4" x 16(G)', "24"), ('5" x 13(G)', "44")])),
    P(23, "Ordinary Butt Hinges SS", "door-hinges", "Ordinary Butt Hinges SS (Beeta)", "26.40", "Pcs", None,
      catalogue_page="21",
      attrs={"finish": "SS", "length": "3"},
      variants=sizes([('3" x 16(G)', "26.40"), ('4" x 16(G)', "44.10"), ('5" x 13(G)', "61.60")], finish="SS")),
    P(23, "Superfine Hinges (Beeta)", "door-hinges", "Superfine Hinges (Beeta)", "28.60", "Pcs", None,
      catalogue_page="21",
      attrs={"finish": "SS"},
      variants=sizes([
          ('3" x 12(G)', "48.10"), ('3" x 16(G)', "28.60"), ('4" x 14(G)', "53.30"),
          ('4" x 12(G)', "68.90"), ('5" x 14(G)', "71.50"), ('5" x 12(G)', "94.90"),
      ], finish="SS")),
    P(23, "SS L Hinges", "door-hinges", "SS L Hinges", "44", "Pcs", None,
      catalogue_page="21",
      attrs={"finish": "SS"},
      variants=[
          V("6 mm without lock", "44", size="6 mm", finish="W/O Lock", unit="Pcs"),
          V("6 mm lock welded", "50", size="6 mm", finish="Lock Welded", unit="Pcs"),
          V("12 mm without lock", "46", size="12 mm", finish="W/O Lock", unit="Pcs"),
          V("12 mm lock welded", "53", size="12 mm", finish="Lock Welded", unit="Pcs"),
          V("19 mm without lock", "48", size="19 mm", finish="W/O Lock", unit="Pcs"),
          V("19 mm lock welded", "56", size="19 mm", finish="Lock Welded", unit="Pcs"),
      ]),
    P(23, "SS Parliament Hinges", "door-hinges", "SS Parliament Hinges", "210", "Pcs", None,
      catalogue_page="21",
      attrs={"finish": "SS", "length": "3"},
      variants=[
          V('3" / 2.5 mm', "210", size='3"', finish="2.5 mm", unit="Pcs"),
          V('3" / 3 mm', "286", size='3"', finish="3 mm", unit="Pcs"),
          V('4" / 2.5 mm', "252", size='4"', finish="2.5 mm", unit="Pcs"),
          V('4" / 3 mm', "316", size='4"', finish="3 mm", unit="Pcs"),
          V('5" / 2.5 mm', "306", size='5"', finish="2.5 mm", unit="Pcs"),
          V('5" / 3 mm', "372", size='5"', finish="3 mm", unit="Pcs"),
      ]),
    # Glass, printed page 23
    P(25, "GF001", "glass-fittings", "SS F Bracket", "60", "Pcs", "GF001",
      catalogue_page="23",
      attrs={"finish": "SS"},
      note="Printed for 6 mm, 8 mm and 12 mm glass at the same rate for each length. The title also reads 8 mm.",
      variants=sizes([('4"', "60"), ('6"', "70"), ('8"', "80"), ('10"', "96"), ('12"', "104")], finish="SS")),
    P(25, "GF002", "glass-fittings", "D-Bracket", "12", "Pcs", "GF002",
      catalogue_page="23",
      note="Printed for 6 mm, 8 mm and 12 mm glass. Light and heavy are different rates.",
      variants=[
          V('2" Light', "12", size='2"', finish="Light", unit="Pcs"),
          V('2" Heavy', "22", size='2"', finish="Heavy", unit="Pcs"),
      ]),
    P(25, "GF004", "glass-fittings", "Brass Glass Hinges", "260", "Pcs", "GF004", catalogue_page="23"),
    P(25, "GF015", "glass-fittings", "Glass Lock", "120", "Pcs", "GF015", catalogue_page="23"),
    # Mortise, printed page 25. K.Y. is printed as-is. No warranty period is printed.
    P(27, "I-1 B. Silver", "mortise-handles", "7 inch Mortise Handle I-1 B. Silver K.Y.", "840", "Pcs", None,
      catalogue_page="25",
      attrs={"size": '7"', "finish": "B. Silver"},
      note="Printed B. Silver K.Y. Photograph shows the lock body, screws and spindle with the handle."),
    P(27, "I-3 B. Silver", "mortise-handles", "7 inch Mortise Handle I-3 B. Silver K.Y.", "840", "Pcs", None,
      catalogue_page="25", attrs={"size": '7"', "finish": "B. Silver"}),
    P(27, "I-7 B. Silver", "mortise-handles", "7 inch Mortise Handle I-7 B. Silver K.Y.", "840", "Pcs", None,
      catalogue_page="25", attrs={"size": '7"', "finish": "B. Silver"}),
    P(27, "Jewel C.P.", "mortise-handles", "7 inch Mortise Handle Jewel C.P. K.Y.", "840", "Pcs", None,
      catalogue_page="25",
      attrs={"size": '7"', "finish": "Chrome"},
      note="Printed C.P., chrome plated."),
    # Kitchen baskets, printed page 28. Prices have no unit on the page.
    P(30, "NEFF", "kitchen-baskets", "Neff Plain Basket", "1585", None, "NEFF-PLAIN",
      catalogue_page="28", image_anchor="Plain Basket",
      attrs={"size": "15 x 18 inch to 21 x 20 inch"},
      note="Width x depth by basket height, from the Neff table. The page does not print a warranty.",
      variants=[
          V(f"{box} / {height}", price, size=f"{box} / {height}")
          for box, prices in {
              "15x18": ("1585", "1939", "2136"),
              "15x20": ("1585", "1939", "2136"),
              "17x18": ("1766", "2179", "2345"),
              "17x20": ("1766", "2179", "2345"),
              "19x20": ("2046", "2421", "2580"),
              "21x20": ("2182", "2636", "2734"),
          }.items()
          for height, price in zip(('4"', '6"', '8"'), prices)
      ]),
    P(30, "NEFF", "kitchen-baskets", "Neff Thali Basket 8 inch", "2523", None, "NEFF-THALI",
      catalogue_page="28", image_anchor="Thali & Plate",
      attrs={"size": 'Thali 8"'},
      variants=[
          V(size, price, size=size)
          for size, price in [
              ("15x18", "2523"), ("15x20", "2523"), ("17x18", "3045"),
              ("17x20", "3045"), ("19x20", "3304"), ("21x20", "3578"),
          ]
      ]),
    P(30, "6X20X18 BOTTLE PULL OUT", "kitchen-baskets", "Neff Bottle Pull Out", "2635", None, "NEFF-BOTTLE",
      catalogue_page="28", image_anchor="Bottle Pull Out",
      attrs={"size": "6 x 20 x 18"},
      variants=[
          V("6 x 20 x 18", "2635", size="6 x 20 x 18"),
          V("8 x 20 x 18", "3088", size="8 x 20 x 18"),
          V("6 x 20 x 21", "3897", size="6 x 20 x 21"),
          V("8 x 20 x 21", "4590", size="8 x 20 x 21"),
      ]),
    P(30, "KEYATOR", "kitchen-baskets", "Keyator Plain Basket", "1192", None, "KEYATOR-PLAIN",
      catalogue_page="28", image_anchor="Plain Basket",
      attrs={"size": "15 x 18 inch to 21 x 20 inch"},
      note="Width x depth by basket height, from the Keyator table.",
      variants=[
          V(f"{box} / {height}", price, size=f"{box} / {height}")
          for box, prices in {
              "15x18": ("1192", "1519", "1714"),
              "15x20": ("1192", "1519", "1714"),
              "17x18": ("1384", "1712", "1864"),
              "17x20": ("1384", "1712", "1864"),
              "19x20": ("1653", "2033", "2204"),
              "21x20": ("1768", "2155", "2281"),
          }.items()
          for height, price in zip(('4"', '6"', '8"'), prices)
      ]),
    P(30, "KEYATOR", "kitchen-baskets", "Keyator Cutlery Box", "2629", None, "KEYATOR-CUTLERY",
      catalogue_page="28", image_anchor="Cutlary Perforated",
      attrs={"size": 'Cutlary box fix 4"'},
      note='The Keyator column is printed "Cutlary Box Fix 4".',
      variants=[
          V(size, price, size=size)
          for size, price in [
              ("15x18", "2629"), ("15x20", "2629"), ("17x18", "2975"),
              ("17x20", "2975"), ("19x20", "3567"), ("21x20", "3898"),
          ]
      ]),
    P(30, "6X20X18 BOTTLE PULL OUT", "kitchen-baskets", "Keyator Bottle Pull Out", "2350", None, "KEYATOR-BOTTLE",
      catalogue_page="28", image_anchor="Bottle Pull Out",
      attrs={"size": "6 x 20 x 18"},
      note="The Keyator bottle-pull-out rates are the lower table on this page.",
      variants=[
          V("6 x 20 x 18", "2350", size="6 x 20 x 18"),
          V("8 x 20 x 18", "2675", size="8 x 20 x 18"),
          V("6 x 20 x 21", "3094", size="6 x 20 x 21"),
          V("8 x 20 x 21", "3672", size="8 x 20 x 21"),
      ]),
    # Cabinet handles. Page 29 prints /Pcs. Page 34 prints the rate without a unit.
    P(31, "OVEL C T.T.", "cabinet-handles", "Oval C T.T. Cabinet Handle", "48", "Pcs", None,
      catalogue_page="29",
      variants=sizes([('4"', "48"), ('6"', "72"), ('8"', "96")])),
    P(31, "SS ROUND D", "cabinet-handles", "SS Round D Cabinet Handle", "30", "Pcs", None,
      catalogue_page="29",
      attrs={"finish": "SS"},
      variants=[
          V(f'{size} {section}', price, size=size, finish=section, unit="Pcs")
          for section, prices in (("8 mm", ("30", "40", "60")), ("10 mm", ("33", "44", "66")))
          for size, price in zip(('3"', '4"', '6"'), prices)
      ]),
    P(36, "CH-1409", "cabinet-handles", "Cabinet Handle CH-1409", "336", None, "CH-1409",
      catalogue_page="34",
      note="Rates on this page are printed without a unit. R/G is the rose-gold finish printed on the card. The extra photograph is a PVRD marketing image marked model 1409, Rose Gold + SBN. That finish is not in the printed rate table.",
      variants=matrix(["96 mm", "160 mm", "224 mm", "288 mm"], [
          ("R/G+Grey", ("336", "584", "796", "976")),
          ("R/G+Qubic", ("336", "584", "796", "976")),
      ], unit=None)),
    P(36, "CH-1413", "cabinet-handles", "Cabinet Handle CH-1413", "208", None, "CH-1413",
      catalogue_page="34",
      variants=matrix(["96 mm", "160 mm", "224 mm", "288 mm"], [
          ("Gold Glossy", ("208", "344", "496", "628")),
          ("R/G Glossy", ("208", "344", "496", "628")),
      ], unit=None)),
    P(36, "CH-446", "cabinet-handles", "Cabinet Handle CH-446", "148", None, "CH-446",
      catalogue_page="34",
      note="C.P. is the chrome-plated finish printed on the card.",
      variants=matrix(["96 mm", "160 mm", "224 mm", "288 mm"], [
          ("C.P.", ("148", "260", "380", "516")),
          ("Choco Glossy", ("172", "304", "440", "588")),
      ], unit=None)),
    P(36, "CH-1298", "cabinet-handles", "Cabinet Handle CH-1298", "196", None, "CH-1298",
      catalogue_page="34",
      variants=matrix(["96 mm", "160 mm", "224 mm", "288 mm"], [
          ("C.P.", ("196", "304", "420", "572")),
          ("Choco Glossy", ("220", "356", "480", "644")),
      ], unit=None)),
    P(36, "CH-460", "cabinet-handles", "Cabinet Handle CH-460", "260", None, "CH-460",
      catalogue_page="34",
      variants=sizes([("96 mm", "260"), ("160 mm", "424"), ("224 mm", "664"), ("288 mm", "876")], unit=None, finish="Choco Glossy")),
    P(36, "CH-1361", "cabinet-handles", "Cabinet Handle CH-1361", "485", None, "CH-1361",
      catalogue_page="34",
      variants=sizes([("96 mm", "485"), ("160 mm", "781"), ("224 mm", "1037")], unit=None, finish="R/G + SBN")),
    P(34, "CH-1346", "cabinet-handles", "Cabinet Handle CH-1346", "188", None, "CH-1346",
      catalogue_page="32",
      variants=matrix(["96 mm", "160 mm", "224 mm", "288 mm"], [
          ("C.P.", ("188", "288", "408", "560")),
          ("Satin", ("212", "336", "472", "636")),
          ("Choco Glossy", ("212", "336", "472", "636")),
      ], unit=None)),
    P(34, "CH-1364", "cabinet-handles", "Cabinet Handle CH-1364", "188", None, "CH-1364",
      catalogue_page="32",
      variants=sizes([("96 mm", "188"), ("160 mm", "320"), ("224 mm", "440"), ("288 mm", "580")], unit=None, finish="C.P.")),
    P(34, "CH-1369", "cabinet-handles", "Cabinet Handle CH-1369", "188", None, "CH-1369",
      catalogue_page="32",
      variants=matrix(["96 mm", "160 mm", "224 mm", "288 mm"], [
          ("C.P.", ("188", "304", "452", "632")),
          ("Choco Glossy", ("212", "356", "516", "708")),
      ], unit=None)),
    P(34, "CH-1373", "cabinet-handles", "Cabinet Handle CH-1373", "332", None, "CH-1373",
      catalogue_page="32",
      variants=sizes([("96 mm", "332"), ("160 mm", "564"), ("224 mm", "792"), ("288 mm", "1020")], unit=None, finish="Satin + C.P.")),
    # Wardrobe, printed page 40
    P(42, "Concealed Handle 102", "wardrobe-fittings", "Concealed Handle 102 1-Way C.P.", "100", "Pcs", "102",
      catalogue_page="40",
      attrs={"finish": "Chrome"},
      variants=sizes([("64 mm", "100"), ("96 mm", "110"), ("128 mm", "130"), ("160 mm", "140")], finish="C.P.")),
    P(42, "Chest Handle 146", "wardrobe-fittings", "Chest Handle 146", "160", "Pcs", "146", catalogue_page="40"),
    P(42, "Chest Handle 150", "wardrobe-fittings", "Chest Handle 150", "160", "Pcs", "150",
      catalogue_page="40",
      variants=[
          V("Black", "160", finish="Black Matt", unit="Pcs"),
          V("C.P. + Brush", "160", finish="Chrome", unit="Pcs"),
      ]),
    # Profiles on printed page 41
    P(43, "10.5ft G PROFILE", "profile-pipes", "10.5 ft G Profile", "2100", "Pcs", None,
      catalogue_page="41",
      attrs={"size": "10.5 ft"},
      variants=[
          V("C.P.", "2100", finish="Chrome", size="10.5 ft", unit="Pcs"),
          V("Rose Gold", "2100", finish="Rose Gold", size="10.5 ft", unit="Pcs"),
          V("Black", "2100", finish="Black Matt", size="10.5 ft", unit="Pcs"),
      ]),
    P(43, "8ft SS Inlay Patti", "profile-pipes", "8 ft SS Inlay Patti", "192", "Pcs", None,
      catalogue_page="41",
      attrs={"finish": "SS", "size": "8 ft"},
      variants=[
          V(f"{size} {finish}", price, size=size, finish=finish, unit="Pcs")
          for finish in ("Gold", "Rose Gold")
          for size, price in (("12 mm", "192"), ("19 mm", "304"), ("25 mm", "400"), ("38 mm", "608"))
      ]),
    # Telescopic, printed page 42
    P(44, "Black Light", "telescopic-channel", "MS Telescopic Channel Black Light", "180", "Set", None,
      catalogue_page="42",
      attrs={"finish": "Black Matt", "size": '10"'},
      note="The catalogue spells the heading Teliscopic. Packing is printed beside each size.",
      variants=[
          V(size, price, size=size, finish="Black Matt", unit="Set", packing="10 Set")
          for size, price in [('10"', "180"), ('12"', "216"), ('14"', "252"), ('16"', "288")]
      ]),
    P(44, "Black Economy", "telescopic-channel", "MS Telescopic Channel Black Economy", "220", "Set", None,
      catalogue_page="42",
      attrs={"finish": "Black Matt", "size": '8"'},
      variants=[
          V(size, price, size=size, finish="Black Matt", unit="Set", packing="10 Set")
          for size, price in [
              ('8"', "220"), ('10"', "220"), ('12"', "264"), ('14"', "308"), ('16"', "352"),
              ('18"', "396"), ('20"', "440"), ('22"', "484"), ('24"', "528"),
          ]
      ]),
    P(44, "Black Heavy", "telescopic-channel", "MS Telescopic Channel Black Heavy", "260", "Set", None,
      catalogue_page="42",
      attrs={"finish": "Black Matt", "size": '10"'},
      variants=[
          V(size, price, size=size, finish="Black Matt", unit="Set", packing="15 Set")
          for size, price in [('10"', "260"), ('12"', "312"), ('14"', "364"), ('16"', "416"), ('18"', "468"), ('20"', "520")]
      ]),
    P(44, "SS Teliscopic Channel Heavy", "telescopic-channel", "SS Telescopic Channel Heavy", "360", "Set", None,
      catalogue_page="42",
      attrs={"finish": "SS", "size": '10"'},
      variants=[
          V(size, price, size=size, finish="SS", unit="Set", packing="15 Set")
          for size, price in [('10"', "360"), ('12"', "432"), ('14"', "504"), ('16"', "576"), ('18"', "648"), ('20"', "720")]
      ]),
    # Edge tape, printed page 43. Both series are 50 m x 21 mm x 0.45 mm.
    P(45, "3021", "edge-bindings", "PVC Edge Tape 3021 T.L. White", "600", "Roll", "3021",
      catalogue_page="43",
      attrs={"shadeName": "T.L. White", "finish": "White", "size": "50 m x 21 mm x 0.45 mm"},
      note="Listed with the solid high-glossy PVC tapes."),
    P(45, "3076", "edge-bindings", "PVC Edge Tape 3076 Chocolate", "600", "Roll", "3076",
      catalogue_page="43",
      attrs={"shadeName": "Chocolate", "finish": "Chocolate", "size": "50 m x 21 mm x 0.45 mm"}),
    P(45, "5036", "edge-bindings", "PVC Edge Tape 5036 Teak", "900", "Roll", "5036",
      catalogue_page="43",
      attrs={"shadeName": "Teak", "finish": "Teak", "size": "50 m x 21 mm x 0.45 mm"},
      note="Listed with the teak high-glossy PVC tapes."),
    P(45, "5170", "edge-bindings", "PVC Edge Tape 5170 Chest Nut", "800", "Roll", "5170",
      catalogue_page="43",
      attrs={"shadeName": "Chest Nut", "finish": "Chest Nut", "size": "50 m x 21 mm x 0.45 mm"}),
    # Castors, printed page 44
    P(46, "6 Wheel Mini Fix", "castor-wheels", "6 Wheel Mini Fix", "240", "Set", None, catalogue_page="44", attrs={"size": "6 wheel"}),
    P(46, "6 Wheel Fix Heavy", "castor-wheels", "6 Wheel Fix Heavy", "340", "Set", None, catalogue_page="44", attrs={"size": "6 wheel"}),
    P(46, "Single Puff Wheel", "castor-wheels", "Single Puff Wheel Castor", "450", "Set", None, catalogue_page="44"),
    # Magnet catchers, printed page 45
    P(47, "Magnet Catcher M-1", "miscellaneous", "Magnet Catcher M-1", "18", "Pcs", "M-1", catalogue_page="45"),
    P(47, "Magnet Catcher M-3", "miscellaneous", "Magnet Catcher M-3", "22", "Pcs", "M-3", catalogue_page="45"),
    P(47, "Long Magnet Catcher", "miscellaneous", "Long Magnet Catcher E-4 (Egybell)", "70", "Pcs", "E-4", catalogue_page="45"),
    # Locks, printed page 46
    P(48, "Bose 2", "locks", "MP Lock Bose 2", "16", "Pcs", None, catalogue_page="46",
      note="Photograph shows the lock with two keys."),
    P(48, "Cosco S/A", "locks", "MP Lock Cosco S/A", "90", "Pcs", None, catalogue_page="46"),
    P(48, "Enzo Lazer", "locks", "MP Lock Enzo Lazer With Master Key", "250", "Pcs", None, catalogue_page="46",
      note="Printed with master key. Photograph shows three keys."),
    P(48, "Cupboard Lock Super Ultra", "locks", "Cupboard Lock Super Ultra", "500", "Pcs", None, catalogue_page="46"),
    # Tower bolts, printed page 47. The page spells it Towebolt.
    P(49, "9mm Towebolt", "tower-bolts", "9 mm Tower Bolt", "38", "Pcs", None,
      catalogue_page="47", attrs={"size": '4"', "finish": "SS"},
      variants=sizes([('3"', "38"), ('4"', "44"), ('6"', "66"), ('8"', "88")], finish="SS")),
    P(49, "10mm Towebolt", "tower-bolts", "10 mm Tower Bolt", "54", "Pcs", None,
      catalogue_page="47", attrs={"size": '4"', "finish": "SS"},
      variants=sizes([('3"', "54"), ('4"', "64"), ('6"', "96"), ('8"', "128"), ('10"', "160"), ('12"', "192")], finish="SS")),
    P(49, "Ovel Towerbolt", "tower-bolts", "10 mm Aluminium Oval Tower Bolt", "100", "Pcs", None,
      catalogue_page="47",
      attrs={"size": '4"'},
      note='The catalogue spells this "Ovel Towerbolt".',
      variants=sizes([('4"', "100"), ('6"', "138"), ('8"', "184")])),
    P(49, "L-TowerBolt", "tower-bolts", "L Tower Bolt", "84", "Pcs", None,
      catalogue_page="47",
      variants=sizes([('4"', "84"), ('6"', "126"), ('8"', "168")])),
    P(49, "Mowjee", "tower-bolts", "MS Tower Bolt Black (Mowjee)", "60", "Pcs", None,
      catalogue_page="47", attrs={"finish": "Black Matt"},
      variants=sizes([('3"', "60"), ('4"', "80"), ('5"', "100"), ('6"', "120")], finish="Black Matt")),
    # Bathroom, printed pages 51 and 52
    P(53, "SS Towel Ring (Heavy)", "bathroom-fittings", "SS Towel Ring Heavy", "210", "Pcs", None,
      catalogue_page="51", attrs={"finish": "SS"},
      variants=[
          V(shape, "210", finish="SS", unit="Pcs")
          for shape in ("Round", "Ovel", "Triangular", "Square")
      ]),
    P(53, "Towel Rod Round\n", "bathroom-fittings", "Towel Rod Round", "300", "Pcs", None,
      catalogue_page="51", attrs={"finish": "SS"},
      note="Two pack sizes are printed.",
      variants=[
          V('18" pack of 10', "300", size='18"', unit="Pcs"),
          V('24" pack of 10', "330", size='24"', unit="Pcs"),
          V('18" pack of 8', "390", size='18"', unit="Pcs"),
          V('24" pack of 8', "420", size='24"', unit="Pcs"),
      ]),
    P(53, "Round Antiq", "bathroom-fittings", "Towel Rod Round Antique", "600", "Pcs", None,
      catalogue_page="51", attrs={"finish": "Antique Brass", "size": '24"'},
      note="24 inch, pack of 10."),
    P(53, "Round Rose Gold", "bathroom-fittings", "Towel Rod Round Rose Gold", "600", "Pcs", None,
      catalogue_page="51", attrs={"finish": "Rose Gold", "size": '24"'},
      note="24 inch, pack of 10."),
    P(54, "24” Towel Rack 4 Pipes", "bathroom-fittings", "24 inch Towel Rack 4 Pipes", "1040", "Pcs", None,
      catalogue_page="52", attrs={"size": '24"'}),
    P(54, "3 In 1 Bathroom Shelf", "bathroom-fittings", "3 In 1 Bathroom Shelf", "1040", "Pcs", None, catalogue_page="52"),
    # Aluminium, printed page 53
    P(55, "Woolpile", "aluminium-products", "Woolpile", "260", "Roll", None,
      catalogue_page="53",
      variants=[
          V("90 m", "260", size="90 m", unit="Roll"),
          V("115 m", "330", size="115 m", unit="Roll"),
          V("215 m", "580", size="215 m", unit="Pcs"),
      ]),
    P(55, "Nylon U Rubber", "aluminium-products", "Nylon U Rubber", "210", "Kg", None, catalogue_page="53"),
    P(55, "Alluminium Towerbolt", "aluminium-products", "Aluminium Tower Bolt", "360", "Dzn", None,
      catalogue_page="53",
      variants=sizes([('4"', "360"), ('6"', "560")], unit="Dzn")),
    # Screws, printed page 54. Full-thread and half-thread rates have no unit; packing is printed beside them.
    P(56, "Stainless Steel Screw Full Thread", "screws-carriage-bolts", "Stainless Steel Screw Full Thread", "112", None, None,
      catalogue_page="54",
      attrs={"finish": "SS"},
      note="Each rate is printed beside the packing quantity. The page does not mark the rate as per piece.",
      variants=[
          V(f"{size} {head}", price, size=size, finish=head, packing=packing)
          for size, packing, slot, phillips in [
              ("13x4", "200 Pcs", "112", "178"), ("13x6", "200 Pcs", "130", "214"),
              ("19x4", "200 Pcs", "132", "216"), ("19x5", "200 Pcs", "154", "258"),
              ("19x6", "200 Pcs", "158", "264"), ("25x4", "200 Pcs", "150", "228"),
              ("25x6", "200 Pcs", "208", "364"), ("30x7", "100 Pcs", "156", "258"),
              ("35x8", "100 Pcs", "182", "302"), ("50x8", "100 Pcs", "246", "398"),
              ("50x10", "100 Pcs", "326", "530"), ("60x10", "100 Pcs", "638", "1050"),
              ("75x10", "100 Pcs", "1020", "1736"), ("100x10", "100 Pcs", "1260", "2140"),
          ]
          for head, price in (("CSK (-)", slot), ("CSK Phillips", phillips))
      ]),
    P(56, "Iron Half Thread Screw", "screws-carriage-bolts", "Iron Half Thread Screw", "79.60", None, None,
      catalogue_page="54",
      note="Each rate is printed beside the packing quantity. The page does not mark the rate as per piece.",
      variants=[
          V(f"{size} {head}", price, size=size, finish=head, packing=packing)
          for size, packing, metal, chrome in [
              ("20x5", "200 Pcs", "79.60", "98.30"), ("20x6", "200 Pcs", "84.50", "105.40"),
              ("25x5", "200 Pcs", "93.50", "115.50"), ("25x6", "200 Pcs", "97.40", "102.40"),
              ("30x7", "100 Pcs", "63.30", "78.10"), ("35x8", "100 Pcs", "78.00", "96.40"),
              ("50x8", "100 Pcs", "113.50", "137.80"), ("50x10", "100 Pcs", "144.50", "178.50"),
              ("60x10", "100 Pcs", "169.00", "208.80"), ("75x10", "100 Pcs", "224.40", "277.20"),
              ("100x10", "100 Pcs", "336.00", "415.00"),
          ]
          for head, price in (("Metal", metal), ("Chrome Polish", chrome))
      ]),
    P(56, "Carriage Bolt With Washer", "screws-carriage-bolts", "Carriage Bolt With Washer", "300", "Pkt", None,
      catalogue_page="54",
      note="Packing is 100 pieces. Rates are printed per packet.",
      variants=[
          V(f'{size} {finish}', price, size=size, finish=finish, unit="Pkt", packing="100 Pcs")
          for size, chrome, steel in [
              ('1.5"', "300", "600"), ('2"', "340", "700"), ('2.5"', "400", "800"), ('3"', "440", "900"),
          ]
          for finish, price in (("Chrome Polish", chrome), ("Stainless Steel", steel))
      ]),
    P(56, "Drywall Screw", "screws-carriage-bolts", "Drywall Screw", "39", "Hnd", None,
      catalogue_page="54",
      note="Rates are printed per hundred (hnd).",
      variants=[
          V(size, price, size=size, unit="Hnd", packing=packing)
          for size, packing, price in [
              ("13x6", "1000 Pcs", "39"), ("19x6", "1000 Pcs", "44"),
              ("25x6", "1000/800 Pcs", "50"), ("32x6", "400/500/750 Pcs", "62"),
              ("38x6", "500/750 Pcs", "73"), ("50x6", "400/500 Pcs", "120"),
              ("60x6", "250/300/400 Pcs", "122"), ("75x6", "250 Pcs", "126"),
              ("100x6", "200 Pcs", "148"),
          ]
      ]),
]


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).replace("\u00ad", "")
    text = text.replace("“", '"').replace("”", '"').replace("’", "'")
    return re.sub(r"\s+", " ", text).strip()


def lines_of(page):
    rows = []
    for block in page.get_text("dict")["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            text = norm("".join(span["text"] for span in line["spans"]))
            if not text:
                continue
            x0, y0, x1, y1 = line["bbox"]
            rows.append({"t": text, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2})
    return rows


def images_of(page):
    images = []
    for info in page.get_image_info(xrefs=True):
        x0, y0, x1, y1 = info["bbox"]
        if y0 < 90 or (x1 - x0) < 36 or (y1 - y0) < 36:
            continue
        if (x1 - x0) > 520 and (y1 - y0) > 640:
            continue
        images.append({
            "x0": x0, "y0": y0, "x1": x1, "y1": y1,
            "cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2,
            "xref": info.get("xref"),
        })
    images.sort(key=lambda image: (image["y0"], image["x0"]))
    kept = []
    for image in images:
        if any(abs(image["cx"] - other["cx"]) < 14 and abs(image["cy"] - other["cy"]) < 14 for other in kept):
            continue
        kept.append(image)
    return kept


def find_line(lines, anchor):
    needle = norm(anchor).lower()
    hits = [line for line in lines if needle in line["t"].lower() and line["y0"] > 80]
    if not hits:
        return None
    hits.sort(key=lambda line: (line["y0"], line["x0"]))
    return hits[0]


def find_image(images, line):
    above = [
        image for image in images
        if image["y1"] <= line["y0"] + 36 and abs(image["cx"] - line["cx"]) < 170
    ]
    if above:
        return min(above, key=lambda image: (line["y0"] - image["y1"], abs(image["cx"] - line["cx"])))
    overlap = [
        image for image in images
        if image["y0"] - 30 <= line["cy"] <= image["y1"] + 50 and abs(image["cx"] - line["cx"]) < 190
    ]
    if overlap:
        return min(overlap, key=lambda image: abs(image["cx"] - line["cx"]))
    below = [
        image for image in images
        if image["y0"] >= line["y0"] - 10 and abs(image["cx"] - line["cx"]) < 170
    ]
    if below:
        return min(below, key=lambda image: (image["y0"] - line["y0"], abs(image["cx"] - line["cx"])))
    return None


def page_blob(page):
    return norm(page.get_text())


def price_present(blob, price):
    token = str(price)
    return re.search(rf"(?<![\d.]){re.escape(token)}(?![\d.])", blob) is not None


def money(price):
    text = f"{float(price):.2f}"
    return text


def describe(product):
    sentence = product["name"]
    if product.get("sku"):
        sentence += f", code {product['sku']},"
    sentence += " is printed in the OM PVRD 2025 catalogue"
    if product.get("cataloguePage"):
        sentence += f", page {product['cataloguePage']}"
    sentence += "."
    if product.get("note"):
        sentence += " " + product["note"]
    variants = product["variants"]
    if variants:
        parts = []
        for variant in variants:
            unit = variant.get("unit") or ""
            packing = f", packing {variant['packing']}" if variant.get("packing") else ""
            unit_text = f"/{unit}" if unit else ""
            parts.append(f"{variant['name']} ₹{variant['price']}{unit_text}{packing}")
        sentence += " Printed MRP: " + "; ".join(parts) + "."
    else:
        unit = f" per {product['unit']}" if product.get("unit") else ""
        sentence += f" Printed MRP ₹{product['price']}{unit}."
    sentence += " The catalogue says rates may change without notice."
    return sentence


def pixmap_image(doc, xref):
    pix = fitz.Pixmap(doc, xref)
    if pix.n >= 5 or pix.alpha or (pix.colorspace and pix.colorspace.n == 4):
        pix = fitz.Pixmap(fitz.csRGB, pix)
    mode = "RGBA" if pix.alpha else "RGB"
    image = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
    if image.mode != "RGB":
        base = Image.new("RGB", image.size, (255, 255, 255))
        base.paste(image, mask=image.getchannel("A") if image.mode == "RGBA" else None)
        image = base
    return image.convert("RGB")


def render_clip(page, image_info):
    rect = fitz.Rect(image_info["x0"], image_info["y0"], image_info["x1"], image_info["y1"])
    rect = fitz.Rect(rect.x0 + 2, rect.y0 + 2, rect.x1 - 2, rect.y1 - 2)
    long_side = max(rect.width, rect.height) or 1
    zoom = min(14, max(5, 1500 / long_side))
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), clip=rect, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def source_image(doc, page, image_info):
    xref = image_info.get("xref") or 0
    shown_ratio = (image_info["x1"] - image_info["x0"]) / max(1, image_info["y1"] - image_info["y0"])
    if xref:
        try:
            image = pixmap_image(doc, xref)
            ratio = image.width / max(1, image.height)
            # Use the embedded file only when the page shows that full frame.
            # A wider file usually means the catalogue cropped it.
            if min(image.size) >= 220 and abs(ratio - shown_ratio) / shown_ratio < 0.15:
                return image
        except Exception:
            pass
    return render_clip(page, image_info)


def enhance(image: Image.Image) -> Image.Image:
    image = ImageOps.autocontrast(image, cutoff=0.15)
    gray = image.convert("L")
    mask = gray.point(lambda value: 255 if value < 246 else 0)
    bbox = mask.getbbox()
    if bbox:
        area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        if area > image.width * image.height * 0.18:
            pad = 48
            image = image.crop((
                max(0, bbox[0] - pad),
                max(0, bbox[1] - pad),
                min(image.width, bbox[2] + pad),
                min(image.height, bbox[3] + pad),
            ))
    long_side = max(image.size)
    if 80 < long_side < 1400:
        scale = min(2.0, 1400 / long_side)
        if scale > 1.08:
            image = image.resize((int(image.width * scale), int(image.height * scale)), Image.Resampling.LANCZOS)
            image = image.filter(ImageFilter.UnsharpMask(radius=1.3, percent=65, threshold=3))
    side = max(max(image.size), 1200)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas


def save_jpeg(image: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "JPEG", quality=92, optimize=True, subsampling=0)


def main():
    if len(PRODUCTS) < 90:
        raise SystemExit(f"expected about 100 products, got {len(PRODUCTS)}")
    doc = fitz.open(PDF)
    pages = {}
    blobs = {}
    for product in PRODUCTS:
        index = product["page"]
        if index not in pages:
            pages[index] = doc[index]
            blobs[index] = page_blob(pages[index])
        blob = blobs[index]
        prices = [product["price"]] + [variant["price"] for variant in product["variants"]]
        missing = [price for price in prices if not price_present(blob, price)]
        if missing:
            raise SystemExit(f"{product['name']} is missing printed prices {missing} on PDF page {index}")
        if norm(product["anchor"]).lower() not in blob.lower():
            raise SystemExit(f"Anchor {product['anchor']!r} is not on PDF page {index} for {product['name']}")

    marketing = json.loads(MATCHES.read_text()) if MATCHES.exists() else []
    extra_by_sku = defaultdict(list)
    for match in marketing:
        extra_by_sku[match["sku"].upper()].append(match["image"])

    cache = {}
    records = []
    shared = {}
    for number, product in enumerate(PRODUCTS, start=1):
        page = pages[product["page"]]
        lines = lines_of(page)
        images = images_of(page)
        line = find_line(lines, product["imageAnchor"])
        if line is None:
            raise SystemExit(f"No caption line for {product['name']} using {product['imageAnchor']!r}")
        image_info = find_image(images, line)
        if image_info is None:
            raise SystemExit(f"No photograph for {product['name']}")
        xref = (product["page"], round(image_info["x0"]), round(image_info["y0"]), image_info.get("xref") or 0)
        if xref not in cache:
            photo = enhance(source_image(doc, page, image_info))
            filename = f"{number:03d}.jpg"
            save_jpeg(photo, IMAGE_DIR / filename)
            cache[xref] = f"products-100/images/{filename}"
            shared[xref] = product["name"]
        else:
            # Same catalogue photograph used for a second priced table, which is expected for shared type photos.
            pass
        gallery = [cache[xref]]
        sku = (product.get("sku") or "").upper()
        for url in extra_by_sku.get(sku, [])[:3]:
            source = ROOT / "web" / "public" / url.lstrip("/")
            if not source.exists():
                continue
            extra_name = f"{number:03d}-{len(gallery)}.jpg"
            save_jpeg(enhance(Image.open(source).convert("RGB")), IMAGE_DIR / extra_name)
            gallery.append(f"products-100/images/{extra_name}")

        attributes = {
            key: value
            for key, value in product["attributes"].items()
            if value
        }
        if product.get("unit"):
            attributes.setdefault("Unit", product["unit"])
        if product.get("cataloguePage"):
            attributes["Catalogue page"] = product["cataloguePage"]
        variants = []
        for variant in product["variants"]:
            variants.append({
                "name": variant["name"],
                "size": variant.get("size"),
                "finish": variant.get("finish"),
                "price": money(variant["price"]),
                "unit": variant.get("unit") or product.get("unit"),
                "packing": variant.get("packing"),
            })
        base = min((float(variant["price"]) for variant in product["variants"]), default=float(product["price"]))
        records.append({
            "name": product["name"],
            "sku": product.get("sku"),
            "category": product["category"],
            "mrp": money(product["price"] if not product["variants"] else base),
            "unit": product.get("unit"),
            "description": describe(product),
            "attributes": attributes,
            "images": gallery,
            "variants": variants,
        })

    payload = {
        "source": "Product Catalogue all 2025.pdf",
        "brand": {
            "name": "PVRD",
            "description": "OM PVRD, established in 1994 at Bokaro, Jharkhand. Dealer and distributor of curtain brackets, aldrops, door kits, handles, hinges, locks, kitchen baskets and wardrobe fittings.",
        },
        "products": records,
    }
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
    multi = sum(1 for item in records if len(item["images"]) > 1)
    with_variants = sum(1 for item in records if item["variants"])
    print(f"products {len(records)}")
    print(f"with variants {with_variants}")
    print(f"with multiple images {multi}")
    from collections import Counter
    print(Counter(item["category"] for item in records))


if __name__ == "__main__":
    main()
