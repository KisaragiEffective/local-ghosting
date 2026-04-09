#![deny(clippy::all)]
#![warn(clippy::nursery)]
// I think this should be in pedantic.
#![allow(clippy::too_long_first_doc_paragraph)]

use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Encodes `input` (UTF-8) into `src_label` bytes, then decodes as `dst_label`.
/// Bytes invalid for `dst_label` become U+FFFD (encoding_rs decoder default).
/// Returns an error string if either label is unrecognized.
#[wasm_bindgen]
pub fn convert(input: &str, src_label: &str, dst_label: &str) -> Result<String, JsValue> {
    let src_enc = encoding_rs::Encoding::for_label(src_label.as_bytes())
        .ok_or_else(|| JsValue::from_str(&format!("Unknown source encoding: {src_label}")))?;
    let dst_enc = encoding_rs::Encoding::for_label(dst_label.as_bytes())
        .ok_or_else(|| JsValue::from_str(&format!("Unknown destination encoding: {dst_label}")))?;

    // Encode UTF-8 input into src_enc bytes (recovering "original" raw bytes).
    // encoding_rs::Encoding::encode() replaces unmappable chars with &#xNNNN; — acceptable
    // for the mojibake recovery flow since those characters wouldn't appear in real mojibake input.
    let (src_bytes, _, _) = src_enc.encode(input);

    // Decode src_enc bytes as dst_enc. Invalid byte sequences → U+FFFD automatically.
    let (result, _) = dst_enc.decode_with_bom_removal(&src_bytes);

    Ok(result.into_owned())
}

/// Returns the list of supported encoding labels for the UI dropdown/tabs.
#[wasm_bindgen]
pub fn supported_encodings() -> Box<[JsValue]> {
    ENCODINGS
        .iter()
        .map(|e| JsValue::from_str(e))
        .collect::<Vec<_>>()
        .into_boxed_slice()
}

const ENCODINGS: &[&str] = &[
    "UTF-8",
    "Shift_JIS",
    "EUC-JP",
    "ISO-2022-JP",
    "GBK",
    "GB18030",
    "Big5",
    "EUC-KR",
    "windows-1252",
    "windows-1250",
    "windows-1251",
    "windows-1253",
    "windows-1254",
    "windows-1255",
    "windows-1256",
    "windows-1257",
    "windows-1258",
    "ISO-8859-2",
    "ISO-8859-3",
    "ISO-8859-4",
    "ISO-8859-5",
    "ISO-8859-6",
    "ISO-8859-7",
    "ISO-8859-8",
    "ISO-8859-10",
    "ISO-8859-13",
    "ISO-8859-14",
    "ISO-8859-15",
    "ISO-8859-16",
    "KOI8-R",
    "KOI8-U",
    "IBM866",
    "macintosh",
    "x-mac-cyrillic",
    "UTF-16LE",
    "UTF-16BE",
];
