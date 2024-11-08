use gloo_utils::format::JsValueSerdeExt;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn validate(input: JsValue) -> JsValue {
    JsValue::from_serde(&crate::validation::validate(input.into_serde().unwrap())).unwrap()
}


#[wasm_bindgen]
pub fn route(input: JsValue) -> JsValue {
    JsValue::from_serde(&crate::board_router::route(input.into_serde().unwrap())).unwrap()
}


#[wasm_bindgen]
pub fn compute_ports(input: JsValue) -> JsValue {
    JsValue::from_serde(&crate::board_router::compute_ports(input.into_serde().unwrap())).unwrap()
}