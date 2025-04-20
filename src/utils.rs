use std::{fs, path::Path};

use convert_case::{Case, Casing};
use serde::Deserialize;
use serde_json::{Map, Value};

use crate::board_router::{RouteInput, RouteInputConnection};

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
                        obj.insert(
                            parameter_name.to_case(Case::Snake),
                            parameter_value.get("value").unwrap().clone(),
                        );
                    }
                }
                _ => return Err("Invalid config file.".to_owned()),
            }

            match json.get("input").unwrap().get("connections").unwrap() {
                serde_json::Value::Object(connections) => {
                    let connections: Vec<Value> = connections
                        .iter()
                        .map(|(connection_id, connection)| {
                            let mut obj = Map::new();
                            let branch_port = connection.get("branchPort");
                            obj.insert("id".to_owned(), connection_id.parse().unwrap());
                            obj.insert("ports".to_owned(), connection.get("ports").unwrap().clone());
                            match branch_port {
                                Some(v) => {
                                    obj.insert("branch_port".to_owned(), v.clone());
                                }
                                None => (),
                            };
                            serde_json::to_value(obj).unwrap()
                        })
                        .collect();
                    obj.insert(
                        "connections".to_owned(),
                        serde_json::to_value(connections).expect("Error."),
                    );
                }
                _ => return Err("Invalid config file.".to_owned()),
            }
            serde_json::to_value(obj).expect("Error")
        } else {
            json
        };

        match RouteInput::deserialize(input_json) {
            Ok(r) => Ok(r),
            Err(e) => Err(format!(
                "{} {}",
                "Not a valid input".to_owned(),
                e.to_string()
            )),
        }
    } else {
        Err("Not a file".to_owned())
    }
}
