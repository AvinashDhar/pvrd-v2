#!/usr/bin/env python3
"""Extract OM PVRD Catalogue 2025 products and photos into local-assets/catalogues."""

import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "local-assets" / "requirements" / "Product Catalogue all 2025.pdf"
OUT_DIR = ROOT / "local-assets" / "catalogues" / "public" / "catalogue"
DATA_PATH = ROOT / "local-assets" / "catalogues" / "data" / "catalogue-2025.json"

HEADER_EXACT = {
    "curtain bracket": "curtain-brackets",
    "aldrops": "door-aldrop",
    "door handles": "door-handles",
    "door fittings": "door-fittings",
    "door hinges": "door-hinges",
    "glass fitting": "glass-fittings",
    "glass fittings": "glass-fittings",
    "mortise handle": "mortise-handles",
    "kitchen basket": "kitchen-baskets",
    "cabinet handles": "cabinet-handles",
    "wardrob fittings": "wardrobe-fittings",
    "wardrobe fittings": "wardrobe-fittings",
    "edge binding tapes": "edge-bindings",
    "magnet catcher": "miscellaneous",
    "locks": "locks",
    "towerbolt": "tower-bolts",
    "bathroom fittings": "bathroom-fittings",
    "alluminium fittings": "aluminium-products",
    "aluminium fittings": "aluminium-products",
    "screws & carriage bolt": "screws-carriage-bolts",
    "screws &  carriage bolt": "screws-carriage-bolts",
    "teliscopic channel": "telescopic-channel",
    "telescopic channel": "telescopic-channel",
}

KEEP_UPPER = {
    "SS", "MS", "PVC", "ABS", "CNC", "CP", "TPI", "ALM", "PC", "SD", "SP", "FP", "MP",
    "HOX", "LS", "DF", "DH", "CB", "CF", "LED", "GI",
}

PRICE_RE = re.compile(r"(\d+(?:\.\d+)?)\s*/\s*([A-Za-z][A-Za-z.]*)")
CODE_RE = re.compile(
    r"^[A-Z]{1,6}\d{2,4}(?:\s*[A-Z]{1,4})?(?:\s*\([^)]+\))?$"
)
CODE_LOOSE = re.compile(r"^[A-Z]{1,6}\d{2,4}(?:\s+[A-Z0-9][A-Z0-9./()-]{0,8})?$")
CHROME_RE = re.compile(r"^(visit us\b|m\.r\.p\.?|p\.?\s*code)$", re.I)
SIZE_RE = re.compile(
    r"^(\d+\s*[xX×]\s*\d+.*|\d+(\.\d+)?\s*(mm|MM|”|\"|inch|'')?|\d+/\d+\s*”?|\d+\s*”.*)$"
)


def norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).replace("\u00ad", "").replace("­", "")
    text = text.replace("“", '"').replace("”", '"').replace("’", "'")
    return re.sub(r"\s+", " ", text).strip()


def norm_key(text: str) -> str:
    return re.sub(r"[^a-z0-9& ]+", "", norm(text).lower()).strip()


def title_name(text: str) -> str:
    words = []
    for word in norm(text).split():
        bare = re.sub(r"[^A-Za-z]", "", word)
        if bare.upper() in KEEP_UPPER:
            words.append(word.upper() if word.isalpha() else word)
        elif re.search(r"\d", word) or (word.isupper() and len(word) <= 3):
            words.append(word)
        else:
            words.append(word[:1].upper() + word[1:].lower() if word.isupper() else word)
    return " ".join(words)


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
            rows.append({
                "t": text,
                "x0": x0,
                "y0": y0,
                "x1": x1,
                "y1": y1,
                "cx": (x0 + x1) / 2,
                "cy": (y0 + y1) / 2,
            })
    return rows


def images_of(page):
    images = []
    for info in page.get_image_info(xrefs=True):
        x0, y0, x1, y1 = info["bbox"]
        width, height = x1 - x0, y1 - y0
        if width < 28 or height < 28:
            continue
        if y0 < 95 and height < 80:
            continue
        if width > 520 and height > 680:
            continue
        images.append({
            "x0": x0, "y0": y0, "x1": x1, "y1": y1,
            "cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2,
            "w": width, "h": height,
            "xref": info.get("xref"),
        })
    images.sort(key=lambda image: -(image["w"] * image["h"]))
    kept = []
    for image in images:
        if any(abs(image["cx"] - other["cx"]) < 18 and abs(image["cy"] - other["cy"]) < 18 for other in kept):
            continue
        kept.append(image)
    kept.sort(key=lambda image: (image["cy"], image["cx"]))
    return kept


def is_chrome(line):
    text = line["t"]
    if CHROME_RE.match(text):
        return True
    if text.lower().startswith("visit us"):
        return True
    if re.fullmatch(r"\d{1,2}", text) and (line["y0"] > 760 or line["y0"] < 40):
        return True
    return False


def page_section(lines, previous):
    for line in lines:
        key = norm_key(line["t"])
        if key in HEADER_EXACT:
            return HEADER_EXACT[key]
    return previous


def assign_column(line, images):
    candidates = []
    for image in images:
        dx = abs(line["cx"] - image["cx"])
        if dx > 120:
            continue
        if image["cy"] > line["cy"] + 28:
            continue
        candidates.append((dx, image))
    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0])
    nearest = candidates[0][0]
    column = [image for dx, image in candidates if dx < nearest + 28]
    column.sort(key=lambda image: image["cy"], reverse=True)
    image = column[0]
    if line["cy"] - image["cy"] > 190:
        return None
    return image


def assign_table(line, images):
    candidates = [
        image for image in images
        if image["x1"] < line["cx"] - 8 and abs(line["cy"] - image["cy"]) < 115
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda image: abs(line["cy"] - image["cy"]))


def looks_like_code(text):
    if CODE_RE.match(text):
        return True
    if CODE_LOOSE.match(text) and re.search(r"\d", text) and "MM" not in text.upper() and len(text) <= 18:
        return True
    return False


def parse_price(text):
    match = PRICE_RE.search(text.replace(" ", "")) or PRICE_RE.search(text)
    if not match:
        return None
    if len(text) > 28:
        return None
    return float(match.group(1)), match.group(2).rstrip(".").capitalize()


def cluster_rows(lines):
    ordered = sorted(lines, key=lambda line: (line["cy"], line["cx"]))
    rows = []
    for line in ordered:
        if rows and abs(line["cy"] - rows[-1][0]["cy"]) <= 7:
            rows[-1].append(line)
        else:
            rows.append([line])
    for row in rows:
        row.sort(key=lambda line: line["cx"])
    return rows


def is_table(rows):
    wide = [row for row in rows if len(row) >= 3]
    priced = 0
    for row in rows:
        blob = " ".join(line["t"] for line in row)
        if parse_price(blob) or re.search(r"/\s*[A-Za-z]", blob):
            priced += 1
    return len(wide) >= 3 and priced >= 3


def product_category(section, name):
    lowered = name.lower()
    if "door kit" in lowered:
        return "door-kits"
    if "interlock" in lowered:
        return "door-interlocks"
    if "teliscopic" in lowered or "telescopic" in lowered:
        return "telescopic-channel"
    if "castor" in lowered or "caster" in lowered or re.search(r"\bwheel\b", lowered):
        return "castor-wheels"
    if "magnet catch" in lowered:
        return "miscellaneous"
    if "towerbolt" in lowered or "tower bolt" in lowered:
        return "tower-bolts"
    if "edge" in lowered and "tape" in lowered:
        return "edge-bindings"
    return section or "miscellaneous"


def parse_table(rows, section, page_number, image_file):
    products = []
    title = None
    header = []
    pending = []

    def flush():
        nonlocal pending, title
        if not title or not pending:
            pending = []
            return
        variants = []
        for row in pending:
            texts = [line["t"] for line in row]
            prices = []
            for text in texts:
                parsed = parse_price(text)
                if parsed:
                    prices.append(parsed)
                elif re.fullmatch(r"\d+(?:\.\d+)?", text):
                    prices.append((float(text), ""))
            if not prices:
                continue
            size = texts[0]
            if len(prices) == 1:
                amount, unit = prices[0]
                variants.append({"name": size, "size": size, "price": amount, "unit": unit or None})
            else:
                labels = header[-len(prices):] if len(header) >= len(prices) else [f"Option {index + 1}" for index in range(len(prices))]
                for label, (amount, unit) in zip(labels, prices):
                    label = re.sub(r"m\.r\.p\.?", "", label, flags=re.I).strip(" /") or "Option"
                    variants.append({
                        "name": f"{size} {label}".strip(),
                        "size": size,
                        "finish": label,
                        "price": amount,
                        "unit": unit or None,
                    })
        if variants:
            amount = min(item["price"] for item in variants)
            unit = next((item["unit"] for item in variants if item["unit"]), None)
            products.append(make_product(title, None, amount, unit, section, page_number, image_file, variants))
        pending = []

    for row in rows:
        texts = [line["t"] for line in row]
        blob = " ".join(texts)
        if any(token in blob.upper() for token in ["M.R.P", "PACKING", "SIZE"]) and not parse_price(blob):
            header = texts
            continue
        if len(texts) <= 2 and not any(parse_price(text) for text in texts) and len(blob) > 8 and not looks_like_code(blob):
            flush()
            title = title_name(blob)
            header = []
            continue
        if title:
            pending.append(row)
    flush()
    return products


def make_product(name, sku, amount, unit, section, page_number, image_file, variants=None):
    name = title_name(name)
    variants = variants or []
    attributes = {}
    if unit:
        attributes["Unit"] = unit
    if variants and len({item.get("size") for item in variants}) > 1:
        attributes["Sizes"] = ", ".join(dict.fromkeys(item["size"] for item in variants if item.get("size")))
    return {
        "name": name,
        "sku": sku,
        "category": product_category(section, name),
        "mrp": amount,
        "unit": unit,
        "image": image_file,
        "page": page_number,
        "variants": [
            {
                "name": title_name(item["name"]),
                "size": item.get("size"),
                "finish": item.get("finish"),
                "price": item["price"],
                "unit": item.get("unit"),
            }
            for item in variants
        ],
        "attributes": attributes,
    }


def parse_finish_grid(lines, section, page_number, image_file):
    codes = [line for line in lines if re.match(r"^CH-?\s*\d{3,4}$", line["t"], re.I)]
    if not codes:
        return None
    sku = re.sub(r"\s+", "", codes[0]["t"].upper())
    if sku.startswith("CH") and not sku.startswith("CH-"):
        sku = "CH-" + sku[2:]
    rows = cluster_rows(lines)
    sizes = []
    variants = []
    seen_header = False
    for row in rows:
        joined = " ".join(line["t"] for line in row)
        if re.search(r"\d+\s*mm", joined, re.I):
            buffer = ""
            sizes = []
            for line in row:
                if re.match(r"^CH", line["t"], re.I):
                    continue
                buffer = f"{buffer} {line['t']}".strip()
                if re.search(r"mm$", buffer, re.I):
                    sizes.append(re.sub(r"\s+", "", buffer))
                    buffer = ""
            seen_header = bool(sizes)
            continue
        if not seen_header:
            continue
        finish = []
        numbers = []
        for line in row:
            if re.fullmatch(r"\d+(?:\.\d+)?", line["t"]):
                numbers.append(float(line["t"]))
            else:
                finish.append(line["t"])
        finish_name = title_name(" ".join(finish))
        if not numbers or not finish_name:
            continue
        labels = sizes[: len(numbers)] or [f"Size {index + 1}" for index in range(len(numbers))]
        while len(labels) < len(numbers):
            labels.append(f"Size {len(labels) + 1}")
        for size, price in zip(labels, numbers):
            variants.append({
                "name": f"{size} {finish_name}",
                "size": size,
                "finish": finish_name,
                "price": price,
                "unit": "Pcs",
            })
    if not variants:
        return None
    amount = min(item["price"] for item in variants)
    return [make_product(f"Cabinet Handle {sku}", sku, amount, "Pcs", section, page_number, image_file, variants)]


def parse_card(lines, section, page_number, image_file):
    grid = parse_finish_grid(lines, section, page_number, image_file)
    if grid:
        return grid
    ordered = sorted(lines, key=lambda line: (line["cy"], line["cx"]))
    prices = []
    codes = []
    names = []
    for line in ordered:
        parsed = parse_price(line["t"])
        if parsed and len(line["t"]) < 22:
            prices.append(parsed)
            continue
        if looks_like_code(line["t"]):
            codes.append(line["t"])
            continue
        if line["t"].upper() in {"SIZE", "PACKING", "PACKING/PKT.", "PACKING/CASE"}:
            continue
        names.append(line["t"])

    if not prices or not names:
        rows = cluster_rows(lines)
        if is_table(rows):
            return parse_table(rows, section, page_number, image_file)
        return []

    name = title_name(" ".join(names[:4]))
    if len(codes) > 1 and len(codes) == len(prices):
        base = re.match(r"[A-Z]+\d+", codes[0])
        same_family = base and all(code.startswith(base.group(0)) for code in codes)
        if same_family:
            variants = []
            for code, (amount, unit) in zip(codes, prices):
                suffix = code[len(base.group(0)):].strip(" -") or code
                variants.append({"name": suffix or code, "size": suffix or None, "finish": None, "price": amount, "unit": unit})
            amount = min(item["price"] for item in variants)
            return [make_product(name, base.group(0), amount, prices[0][1], section, page_number, image_file, variants)]

    if len(prices) > 1:
        size_lines = [line for line in names if SIZE_RE.match(line) or len(line) <= 12]
        detail = [line for line in names if line not in size_lines]
        title = " ".join(detail) or " ".join(names[:2])
        if size_lines and len(size_lines) >= len(prices):
            variants = []
            for size, (amount, unit) in zip(size_lines, prices):
                variants.append({"name": size, "size": size, "finish": None, "price": amount, "unit": unit})
            return [make_product(title, codes[0] if codes else None, min(item["price"] for item in variants), prices[0][1], section, page_number, image_file, variants)]
        if len(names) == 1:
            variants = [
                {"name": f"Option {index + 1}", "size": None, "finish": None, "price": amount, "unit": unit}
                for index, (amount, unit) in enumerate(prices)
            ]
            return [make_product(name, codes[0] if codes else None, prices[0][0], prices[0][1], section, page_number, image_file, variants)]

    amount, unit = prices[0]
    sku = codes[0] if codes else None
    return [make_product(name, sku, amount, unit, section, page_number, image_file)]


def save_image(doc, page, image, dest: Path):
    xref = image.get("xref") or 0
    if xref:
        try:
            extracted = doc.extract_image(xref)
        except Exception:
            extracted = None
        if extracted and extracted.get("image") and len(extracted["image"]) > 800:
            ext = "jpg" if extracted.get("ext") in {"jpg", "jpeg"} else extracted.get("ext", "png")
            if ext == "jpeg":
                ext = "jpg"
            target = dest.with_suffix(f".{ext}")
            target.write_bytes(extracted["image"])
            return target
    clip = fitz.Rect(image["x0"], image["y0"], image["x1"], image["y1"])
    if clip.width < 8 or clip.height < 8:
        return None
    pixmap = page.get_pixmap(clip=clip, dpi=130, alpha=False)
    target = dest.with_suffix(".jpg")
    pixmap.save(str(target), jpg_quality=80)
    return target


def nearest_image_file(doc, page, images, x, y, filename):
    if not images:
        return None
    image = min(images, key=lambda item: abs(item["cx"] - x) + abs(item["cy"] - y))
    saved = save_image(doc, page, image, OUT_DIR / filename)
    if not saved:
        return None
    return f"/catalogue/{saved.name}"


def column_family(name: str) -> str:
    lowered = name.lower()
    if "bottle" in lowered:
        return "Bottle Pull Out"
    if "thali" in lowered or "plate" in lowered:
        return "Thali & Plate"
    if "cutl" in lowered:
        return "Cutlary Basket"
    if "cup" in lowered or "sauc" in lowered:
        return "Cup & Saucer Basket"
    return "Plain Basket"


KITCHEN_COLUMNS = [
    (123, "Plain 4\""),
    (184, "Plain 6\""),
    (240, "Plain 8\""),
    (298, "Thali 8\""),
    (361, "Plate 6\""),
    (431, "Cutlary 4\""),
    (509, "Cup & Saucer 4\""),
]


def parse_kitchen(doc, page, lines, images, page_number):
    labels = []
    for image_index, image in enumerate(images):
        below = [
            line for line in lines
            if 0 <= line["y0"] - image["y1"] < 48 and abs(line["cx"] - image["cx"]) < 90 and line["y0"] < 390
        ]
        if not below:
            continue
        label = title_name(" ".join(line["t"] for line in sorted(below, key=lambda item: item["x0"])))
        saved = save_image(doc, page, image, OUT_DIR / f"p{page_number:02d}-k{image_index:02d}")
        if saved:
            labels.append((norm_key(label), f"/catalogue/{saved.name}", label))

    def photo_for(*words):
        for key, path, _label in labels:
            if all(word in key for word in words):
                return path
        return labels[0][1] if labels else None

    marks = sorted(
        (line["cy"], "Neff" if line["t"].upper() == "NEFF" else "Keyator")
        for line in lines
        if line["t"].upper() in {"NEFF", "KEYATOR"}
    )
    marks.append((800, None))
    grouped = defaultdict(list)
    for (start, finish), (end, _next) in zip(marks, marks[1:]):
        band = [line for line in lines if start < line["cy"] < end and not is_chrome(line)]
        for row in cluster_rows(band):
            texts = " ".join(line["t"] for line in row)
            if re.search(r"WXD|WIDTH|PLAIN|THALI|PLATE|CUTLARY|CUP", texts, re.I) and not re.search(r"\d{3,}", texts):
                continue
            bottle_bits = []
            current = []
            for line in row:
                if "BOTTLE" in line["t"].upper():
                    if current:
                        bottle_bits.append(current)
                    current = [line]
                elif current and re.fullmatch(r"\d{3,5}", line["t"]):
                    current.append(line)
                    bottle_bits.append(current)
                    current = []
                elif not current:
                    pass
            if bottle_bits:
                for bits in bottle_bits:
                    label = " ".join(bit["t"] for bit in bits if not re.fullmatch(r"\d{3,5}", bit["t"]))
                    prices = [float(bit["t"]) for bit in bits if re.fullmatch(r"\d{3,5}", bit["t"])]
                    if not prices:
                        continue
                    grouped["Bottle Pull Out"].append({
                        "name": f"{label} {finish}",
                        "size": label,
                        "finish": finish,
                        "price": prices[0],
                        "unit": "Pcs",
                    })
                continue
            size = next((line["t"] for line in row if re.match(r"^\d+\s*X\s*\d+$", line["t"], re.I)), None)
            if not size:
                continue
            for line in row:
                if not re.fullmatch(r"\d{3,5}", line["t"]):
                    continue
                column = min(KITCHEN_COLUMNS, key=lambda item: abs(item[0] - line["cx"]))
                if abs(column[0] - line["cx"]) > 40:
                    continue
                family = column_family(column[1])
                grouped[family].append({
                    "name": f"{column[1]} {size} {finish}",
                    "size": f"{size} {column[1]}",
                    "finish": finish,
                    "price": float(line["t"]),
                    "unit": "Pcs",
                })

    photos = {
        "Plain Basket": photo_for("plain", "basket"),
        "Thali & Plate": photo_for("thali"),
        "Cutlary Basket": photo_for("cutlary", "perforated") or photo_for("cutlary"),
        "Cup & Saucer Basket": photo_for("cup"),
        "Bottle Pull Out": photo_for("bottle"),
    }
    products = []
    for name, variants in grouped.items():
        if not variants:
            continue
        amount = min(item["price"] for item in variants)
        products.append(make_product(name, None, amount, "Pcs", "kitchen-baskets", page_number, photos.get(name), variants))
    priced_names = {norm_key(product["name"]) for product in products}
    for key, path, label in labels:
        if any(word in key for word in priced_names):
            continue
        if any(token in key for token in ["plain basket", "thali", "cutlary", "cup", "bottle", "saucer", "sauccer"]):
            continue
        product = make_product(label, None, 0, None, "kitchen-baskets", page_number, path)
        product["status"] = "hidden"
        product["attributes"]["Note"] = "Shown in the 2025 catalogue without a printed rate."
        products.append(product)
    return [product for product in products if product["image"]]


def merge_header_cells(lines):
    ordered = sorted(lines, key=lambda line: line["cx"])
    groups = []
    for line in ordered:
        if groups and abs(line["cx"] - groups[-1][0]["cx"]) < 36:
            groups[-1].append(line)
        else:
            groups.append([line])
    return [
        {"t": " ".join(line["t"] for line in group), "cx": sum(line["cx"] for line in group) / len(group)}
        for group in groups
    ]


def parse_ruled_tables(doc, page, lines, images, section, page_number, gutter=None):
    usable = [
        line for line in lines
        if not is_chrome(line) and norm_key(line["t"]) not in HEADER_EXACT and line["t"].upper() not in {"SIZE", "SIZE"}
    ]
    buckets = {0: [], 1: []} if gutter else {0: usable}
    if gutter:
        for line in usable:
            buckets[0 if line["cx"] < gutter else 1].append(line)
    sides = {index: cluster_rows(group) for index, group in buckets.items() if group}

    products = []
    for side_index, rows in sides.items():
        title = None
        title_y = None
        header = []
        variants = []

        def flush():
            nonlocal variants, title
            if not title or not variants:
                variants = []
                return
            image = None
            if title_y is not None:
                same_side = [item for item in images if (item["cx"] < 300) == (side_index == 0)] or images
                nearest = min(same_side, key=lambda item: abs(item["cy"] - title_y))
                image = nearest_image_file(doc, page, [nearest], nearest["cx"], nearest["cy"], f"p{page_number:02d}-t{side_index}-{len(products)}")
            amount = min(item["price"] for item in variants)
            unit = next((item["unit"] for item in variants if item.get("unit")), "Pcs")
            products.append(make_product(title, None, amount, unit, section, page_number, image, variants))
            variants = []

        for row in rows:
            texts = [line["t"] for line in row]
            blob = " ".join(texts)
            if (
                len(row) <= 2
                and not re.search(r"\d", texts[0])
                and len(blob) > 10
                and not parse_price(blob)
                and not re.search(r"packing|m\.r\.p|csk|chrome|phillips|polish|^metal\b|^stainless steel$", blob, re.I)
            ):
                flush()
                title = title_name(blob)
                title_y = row[0]["cy"]
                header = []
                continue
            if re.search(r"packing|m\.r\.p|csk|chrome|phillips|metal", blob, re.I) and not parse_price(blob) and not re.match(r"^\d", texts[0]):
                header = merge_header_cells([
                    line for line in row
                    if not re.search(r"^(size|packing)$", line["t"], re.I)
                ])
                continue
            if not title or not re.search(r"\d", texts[0]):
                continue
            size = texts[0]
            price_lines = []
            for line in row[1:]:
                parsed = parse_price(line["t"])
                if parsed:
                    price_lines.append((line, parsed[0], parsed[1]))
                elif re.fullmatch(r"\d+(?:\.\d+)?", line["t"]):
                    price_lines.append((line, float(line["t"]), "Pcs"))
            if not price_lines:
                continue
            ordered_prices = sorted(price_lines, key=lambda item: item[0]["cx"])
            ordered_headers = sorted(header, key=lambda item: item["cx"])
            chosen_headers = ordered_headers[-len(ordered_prices):] if len(ordered_headers) >= len(ordered_prices) else ordered_headers
            forced = None
            if title and "stainless steel screw" in title.lower() and len(ordered_prices) == 2:
                forced = ["CSK (-)", "CSK Phillips"]
            for index, (line, amount, unit) in enumerate(ordered_prices):
                label = forced[index] if forced else ""
                if (
                    not forced
                    and len(chosen_headers) == len(ordered_prices)
                    and not re.search(r"m\.?\s*r\.?\s*p|packing", chosen_headers[index]["t"], re.I)
                ):
                    label = title_name(chosen_headers[index]["t"])
                variants.append({
                    "name": f"{size} {label}".strip(),
                    "size": size,
                    "finish": label or None,
                    "price": amount,
                    "unit": unit,
                })
        flush()
    return [product for product in products if product.get("image")]


def tidy_product(product):
    name = product["name"]
    if not product.get("sku"):
        match = re.match(r"^([A-Z]{1,5}-?\d{2,4})\b", name)
        if match:
            product["sku"] = match.group(1)
            rest = name[match.end():].strip(" -")
            if len(re.sub(r"[^A-Za-z]", "", rest)) >= 3:
                product["name"] = rest
                name = rest
    letters = re.sub(r"[^A-Za-z]", "", product["name"])
    if len(letters) < 3:
        return None
    if product["name"].lower() in {"size", "packing", "plain", "visit us"}:
        return None
    return product


def main():
    doc = fitz.open(PDF)
    if OUT_DIR.exists():
        for old in OUT_DIR.iterdir():
            if old.is_file():
                old.unlink()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    section = None
    products = []
    seen = set()
    missed = []

    for index in range(doc.page_count):
        page = doc[index]
        lines = lines_of(page)
        section = page_section(lines, section)
        if index < 3 or index == doc.page_count - 1:
            continue
        images = images_of(page)
        page_blob = " ".join(line["t"] for line in lines)
        if "NEFF" in page_blob and "KEYATOR" in page_blob:
            for product in parse_kitchen(doc, page, lines, images, index + 1):
                product = tidy_product(product)
                if not product or not product["name"]:
                    continue
                if product["mrp"] <= 0 and product.get("status") != "hidden":
                    continue
                products.append(product)
            continue
        if "Carriage Bolt" in page_blob or "CSK" in page_blob or "WELDED BUTT" in page_blob.upper():
            gutter = 300 if "CSK" in page_blob or "Drywall" in page_blob else None
            for product in parse_ruled_tables(doc, page, lines, images, section, index + 1, gutter):
                product = tidy_product(product)
                if not product or product["mrp"] <= 0:
                    continue
                products.append(product)
            continue
        groups = defaultdict(list)
        for line in lines:
            if is_chrome(line):
                continue
            if norm_key(line["t"]) in HEADER_EXACT:
                continue
            image = assign_column(line, images)
            if image is None:
                image = assign_table(line, images)
            if image is None:
                if parse_price(line["t"]):
                    missed.append({"page": index + 1, "text": line["t"]})
                continue
            groups[id(image)].append(line)

        for image_index, image in enumerate(images):
            caption = groups.get(id(image), [])
            if not caption:
                continue
            filename = f"p{index + 1:02d}-{image_index:02d}"
            saved = save_image(doc, page, image, OUT_DIR / filename)
            if not saved:
                continue
            public_path = f"/catalogue/{saved.name}"
            parsed = parse_card(caption, section, index + 1, public_path)
            for product in parsed:
                product = tidy_product(product)
                if not product or not product["name"] or product["mrp"] <= 0:
                    continue
                key = (
                    product["category"],
                    (product["sku"] or "").upper(),
                    product["name"].upper(),
                    product["mrp"],
                )
                if key in seen:
                    continue
                seen.add(key)
                products.append(product)

    payload = {
        "source": "Product Catalogue all 2025.pdf",
        "brand": {
            "name": "PVRD",
            "description": "OM PVRD hardware fittings. Curtain brackets, aldrops, door kits, handles, hinges, locks, kitchen and wardrobe fittings.",
        },
        "products": products,
        "unpriced": missed,
    }
    DATA_PATH.write_text(json.dumps(payload, indent=2))
    counts = defaultdict(int)
    for product in products:
        counts[product["category"]] += 1
    print(f"products {len(products)}")
    for slug, count in sorted(counts.items(), key=lambda item: -item[1]):
        print(f"  {count:4d}  {slug}")
    print(f"unpriced lines {len(missed)}")
    print(f"wrote {DATA_PATH}")


if __name__ == "__main__":
    main()
