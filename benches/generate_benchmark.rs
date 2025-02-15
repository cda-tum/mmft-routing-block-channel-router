use std::{fs::{self, File}, io::BufWriter, ops::Range, path::Path};

use mmft_board_router::board_router::{compute_ports, ComputePortsInput, ComputePortsOutput, Layout, RouteInput};
use nanoid::nanoid;
use rand::Rng;

const DIR: &str = "./benches/cases";

fn main() {
    let cases_path = Path::new(DIR);
    let test_batch = random_1();
    let test_batch_path = cases_path.join("test");
    write_to_files(&test_batch_path, &test_batch);
}

fn write_to_files(path: &Path, cases: &Vec<(String, RouteInput)>) {
    for (case_name, case_data) in cases {
        let mut file_name = case_name.clone();
        file_name.push_str(".json");
        serde_json::to_writer(BufWriter::new(File::create(path.join(file_name)).expect("File open error.")) , &serde_json::to_value(case_data).expect("Serialization error.")).expect("File write error.");
    }
}

struct RandomPortConnectionsOptions {
    two_port_frequency_share: f64,
    three_port_frequency_share: f64,
    four_port_frequency_share: f64,
    ports_x: usize,
    ports_y: usize,
    max_relative_distance_x: f64,
    max_relative_distance_y: f64
}

fn random_port_connection(options: &RandomPortConnectionsOptions, occupied_ports: &mut Vec<(usize, usize)>) -> Vec<(usize, usize)> {
    let mut rng = rand::rng();
    let total_frequencies = options.two_port_frequency_share + options.three_port_frequency_share + options.four_port_frequency_share;
    let ports = match rng.random_range(0. ..total_frequencies) {
        v if v < options.two_port_frequency_share => 2,
        v if v < options.two_port_frequency_share + options.three_port_frequency_share => 3,
        _ => 4
    };
    
    let mut candidates = Vec::new();

    while candidates.len() < ports {
        let mut candidate: Option<(usize, usize)> = None;
        while candidate.is_none() || candidates.iter().any(|c: &(usize, usize)| c.0.abs_diff(candidate.unwrap().0) as f64 / options.ports_x as f64 > options.max_relative_distance_x || c.1.abs_diff(candidate.unwrap().1) as f64 / options.ports_y as f64 > options.max_relative_distance_y) {
            let port = loop {
                let port = (rng.random_range(0..options.ports_x), rng.random_range(0..options.ports_y));
                if occupied_ports.contains(&port) {
                    continue
                } else {
                    break port
                }
            };
            candidate = Some(port);
        }
        let p = candidate.unwrap();
        occupied_ports.push(p);
        candidates.push(p);
    }

    candidates
}

fn random_port_connections(n_connections: usize, options: &RandomPortConnectionsOptions) -> Vec<(usize, Vec<(usize, usize)>)> {
    let mut occupied = Vec::new();
    (0..n_connections).map(|i| (i, random_port_connection(&options, &mut occupied))).collect()
}

fn random_1() -> Vec<(String, RouteInput)> {
    let board_width = 105.;
    let board_height = 15.;
    let channel_width = 0.2;
    let channel_spacing = 0.2;
    let pitch = 1.5;
    let pitch_offset_x = 3.;
    let pitch_offset_y = 3.;
    let port_diameter = 0.5;
    let layout = Layout::Octilinear;
    let max_ports = 5000;

    let ComputePortsOutput { ports_x, ports_y } = compute_ports(ComputePortsInput {
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y
    });
    let connections = random_port_connections(10, &RandomPortConnectionsOptions { two_port_frequency_share: 0.8, three_port_frequency_share: 0.1, four_port_frequency_share: 0.1, ports_x, ports_y, max_relative_distance_x: 0.3, max_relative_distance_y: 0.5 });

    Vec::from([(nanoid!(), RouteInput {
        board_width,
        board_height,
        pitch,
        pitch_offset_x,
        pitch_offset_y,
        port_diameter,
        channel_width,
        channel_spacing,
        layout,
        max_ports,
        connections
    })])
}
