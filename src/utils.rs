use std::{fs, path::Path};

use convert_case::{Case, Casing};
use serde::Deserialize;
use serde_json::{Map, Value};

use crate::board_router::RouteInput;

pub fn read_input_from_file(file: &Path) -> Result<RouteInput, String> {
    if file.is_file() {
        let file = file.to_str().unwrap();
        let content = fs::read_to_string(file).expect("Error reading file.");
        let json: serde_json::Value = serde_json::from_str(&content).expect("Invalid JSON.");

        let is_config = json.is_object() && json.get("input").is_some();

        let input_json = if is_config {
            let mut obj = Map::new();
            match json.get("input").unwrap().get("parameters").unwrap() {
                serde_json::Value::Object(parameters) => {
                    for (parameter_name, parameter_value) in parameters.iter() {
                        obj.insert(parameter_name.to_case(Case::Snake), parameter_value.get("value").unwrap().clone());
                    }
                    
                },
                _ => panic!("Invalid config file.")
            }

            match json.get("input").unwrap().get("connections").unwrap() {
                serde_json::Value::Object(connections) => {
                    let connections: Vec<(usize, &Value)> = connections.iter().map(|(connection_id, connection)| (connection_id.parse().unwrap(), connection.get("ports").unwrap())).collect();
                    obj.insert("connections".to_owned(), serde_json::to_value(connections).expect("Error."));
                },
                _ => panic!("Invalid config file.")
            }
            serde_json::to_value(obj).expect("Error")
        } else {
            json
        };

        let input = RouteInput::deserialize(input_json).expect("Not a valid input.");

        Ok(input)
    } else {
        Err("Not a file".to_owned())
    }
}