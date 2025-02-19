use std::{
    collections::HashMap,
    f64,
    fs::{self, File},
    io::BufReader,
    path::Path,
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use statistical::{mean, standard_deviation};
use walkdir::WalkDir;

const DIR: &str = "./benches/cases";
const TARGET_DIR: &str = "./target/criterion";
const NEW_DIR: &str = "new";
const ESTIMATE_FILE: &str = "estimates.json";

#[derive(Serialize, Deserialize)]
struct Aggregate {
    groups: HashMap<String, GroupAggregate>,
}

#[derive(Serialize, Deserialize)]
struct GroupAggregate {
    n: usize,
    mean: f64,
    std: f64,
    min: f64,
    max: f64,
    values: Vec<f64>
}

fn get_mean(obj: Value) -> Option<f64> {
    obj.get("mean")?.get("point_estimate")?.as_f64()
}

fn main() {
    let mut aggregate = Aggregate {
        groups: HashMap::new(),
    };

    for group in WalkDir::new(TARGET_DIR)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if !group.path().is_dir() {
            continue;
        }
        let mut entries = Vec::new();

        for case in WalkDir::new(group.path())
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if !case.path().is_dir() {
                continue;
            }

            let new = case.path().join(NEW_DIR);

            if !new.exists() || !new.is_dir() {
                continue;
            }

            let estimates_file = new.join(ESTIMATE_FILE);

            if !estimates_file.exists() || !estimates_file.is_file() {
                continue;
            }

            let estimates: Value = match fs::read_to_string(estimates_file) {
                Ok(s) => match serde_json::from_str(s.as_str()) {
                    Ok(r) => r,
                    Err(_) => continue,
                },
                Err(_) => continue,
            };

            let mean = match get_mean(estimates) {
                Some(v) => v,
                None => continue,
            };

            entries.push(mean);
        }

        if entries.len() == 0 {
            continue;
        }

        let group_aggregate = GroupAggregate {
            n: entries.len(),
            mean: mean(&entries),
            std: standard_deviation(&entries, None),
            min: entries.iter().fold(f64::INFINITY, |a, &b| a.min(b)),
            max: entries.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)),
            values: entries
        };

        aggregate.groups.insert(
            group.file_name().to_str().unwrap().to_owned(),
            group_aggregate,
        );
    }

    let results = serde_json::to_string(&aggregate).expect("Could not serialize results");
    fs::write(Path::new(DIR).join("aggregate.json"), &results).expect("Could not write results");
}
